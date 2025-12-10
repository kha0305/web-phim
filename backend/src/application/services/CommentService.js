const { Comment, User } = require('../../infrastructure/database');

class CommentService {
    async getComments(req, res) {
        try {
            const { movieId } = req.params;
            const comments = await Comment.findAll({
              where: { movieId },
              include: [{
                model: User,
                attributes: ['username', 'avatar']
              }],
              order: [['createdAt', 'DESC']]
            });
            res.json(comments);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch comments" });
        }
    }

    async addComment(req, res) {
        try {
            const { movieId, content } = req.body;
            const userId = req.user.id;
            if (!content || !content.trim()) return res.status(400).json({ error: "Content is required" });

            const newComment = await Comment.create({ userId, movieId, content: content.trim() });
            const commentWithUser = await Comment.findOne({
                where: { id: newComment.id },
                include: [{ model: User, attributes: ['username', 'avatar'] }]
            });
            res.json(commentWithUser);
        } catch (error) {
             res.status(500).json({ error: "Failed to post comment" });
        }
    }
}

module.exports = CommentService;
