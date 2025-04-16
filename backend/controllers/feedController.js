const Feed = require('../models/Feed');
const User = require('../models/User');

// Create a new post
exports.createPost = async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ msg: 'Content is required' });
    }

    try {
        const newPost = new Feed({ user: req.user.id, content });
        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error. Could not create the post.');
    }
};


// Get all posts (with pagination and connections filter)
exports.getFeed = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const currentUser = await User.findById(req.user.id).populate('connections');
        const connectionIds = currentUser.connections.map(connection => connection._id);

        const feed = await Feed.find({ user: { $in: [...connectionIds, req.user.id] } })
            .sort({ createdAt: -1 })  // Sort by createdAt instead of date
            .lean()
            .populate('user', ['firstName', 'lastName', 'profilePicture'])
            .populate('comments.user', ['firstName', 'lastName', 'profilePicture'])
            .populate('likes', ['firstName', 'lastName', 'profilePicture'])
            .limit(limit * 1)
            .skip((page - 1) * limit);



        const totalPosts = await Feed.countDocuments({ user: { $in: [...connectionIds, req.user.id] } });

        res.json({
            posts: feed,
            totalPages: Math.ceil(totalPosts / limit),
            currentPage: page,
            hasNextPage: page * limit < totalPosts,  // If there are more pages available
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};





// Update a post by ID
exports.updatePost = async (req, res) => {
    const { content } = req.body;

    try {
        let post = await Feed.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the logged-in user is the owner of the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        post = await Feed.findByIdAndUpdate(
            req.params.id,
            { $set: { content } },
            { new: true }
        );

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete a post by ID
exports.deletePost = async (req, res) => {
    try {
        let post = await Feed.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the logged-in user is the owner of the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Feed.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Add a like to a post
exports.addLike = async (req, res) => {
    try {
        const post = await Feed.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the post is already liked by the user
        if (post.likes.some(like => like.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'Post already liked' });
        }

        post.likes.push(req.user.id);
        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Remove a like from a post
exports.removeLike = async (req, res) => {
    try {
        const post = await Feed.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the post is liked by the user
        if (!post.likes.some(like => like.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        // Remove the like
        post.likes = post.likes.filter(like => like.toString() !== req.user.id);
        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
    const { text } = req.body;

    try {
        const post = await Feed.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const newComment = {
            user: req.user.id,
            // user:req.user,
            text
        };

        post.comments.push(newComment);
        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete a comment from a post
// exports.deleteComment = async (req, res) => {
//     try {
//         const post = await Feed.findById(req.params.id);

//         if (!post) {
//             return res.status(404).json({ msg: 'Post not found' });
//         }

//         const comment = post.comments.find(comment => comment.id === req.params.comment_id);

//         if (!comment) {
//             return res.status(404).json({ msg: 'Comment not found' });
//         }

//         if (comment.user.toString() !== req.user.id) {
//             return res.status(401).json({ msg: 'Not authorized' });
//         }

//         post.comments = post.comments.filter(comment => comment.id !== req.params.comment_id);

//         await post.save();

//         res.json(post.comments);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server error');
//     }
// };



// Delete a comment from a post
exports.deleteComment = async (req, res) => {
    try {
        const post = await Feed.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Find the comment to delete
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check if the user is the post owner or the comment owner
        if (post.user.toString() !== req.user.id && comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Remove the comment
        post.comments = post.comments.filter(comment => comment.id !== req.params.comment_id);

        // Save the updated post
        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
