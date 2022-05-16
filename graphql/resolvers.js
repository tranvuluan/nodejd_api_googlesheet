const User = require('./../models/user');
const Post = require('./../models/post');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

module.exports = {
    createUser: async ({ userInput }, req) => {
        const errors = [];
        if (!validator.isEmail(userInput.email))
            errors.push({ message: 'Email is invalid' });

        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 }))
            errors.push({ message: 'Password is invalid' });

        if (errors.length > 0) {
            const error = new Error('Invalid input');
            throw error;
        }
        try {
            const isExistUser = await User.findOne({ email: userInput.email });
            if (isExistUser) {
                const error = new Error('User is exist');
                throw error;
            }
            const hashPassword = await bcrypt.hash(userInput.password, 12);
            const user = new User({
                email: userInput.email,
                name: userInput.name,
                password: hashPassword,
            });
            const createdUser = await user.save();
            return { ...createdUser._doc, password: null, _id: createdUser._id.toString() };
        } catch (err) {
            console.log(err);
        }
    },

    createPost: async ({ postInput }, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }

        const errors = [];
        if (validator.isEmpty(postInput.title) ||
            !validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'Content is invalid' });
        }
        const user = await User.findById(req.userId);
        if (!user) {
            errors.push({ message: 'Content is invalid' });
        }

        if (errors.length > 0) {
            const error = new Error('Invalid user.');
            error.code = 401;
            throw error;
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        });
        const createPost = await post.save();
        // Add post to users posts
        user.posts.push(createPost);
        await user.save();

        return {
            ...createPost._doc, _id: createPost._id.toString(),
            createdAt: createPost.createdAt.toISOString(),
            updatedAt: createPost.updatedAt.toISOString()
        };


    },

    login: async ({ email, password }, req) => {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('User not found');
            error.code = 404;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Password is wrong');
            error.code = 401;
            throw error;
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email
            },
            'somesupersecretsecret',
            { expiresIn: '1h' }
        );
        return { token: token, userId: user._id.toString() };
    },

    posts: async (args, req) => {
        if (!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post
                            .find()
                            .sort({ createdAt: -1 })
                            .populate('creator');

        return { 
            posts: posts.map(post => {
                return {
                ...post._doc, _id: post._id.toString(),
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
                };
            }),
            totalPosts: totalPosts
        }
    }

}