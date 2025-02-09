const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("❌ Database connection failed:", err);
  else console.log("✅ Database connected!");
});

// ✅ Fetch all blogs with comments
app.get("/blogs", (req, res) => {
  const sql = `
    SELECT b.id, b.title, b.content, b.imageUrl, b.views, b.likes, 
           COALESCE(GROUP_CONCAT(c.comment ORDER BY c.id SEPARATOR '||'), '') AS comments
    FROM blogs b
    LEFT JOIN comments c ON b.id = c.blog_id
    GROUP BY b.id`;

  db.query(sql, (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });

    // Format comments into an array
    const blogs = data.map((blog) => ({
      ...blog,
      comments: blog.comments ? blog.comments.split("||") : [],
    }));

    return res.status(200).json(blogs);
  });
});

// ✅ Fetch a single blog with comments
app.get("/blogs/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT b.*, 
           COALESCE(GROUP_CONCAT(c.comment ORDER BY c.id SEPARATOR '||'), '') AS comments
    FROM blogs b
    LEFT JOIN comments c ON b.id = c.blog_id
    WHERE b.id = ?
    GROUP BY b.id`;

  db.query(sql, [id], (err, data) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });
    if (data.length === 0) return res.status(404).json({ error: "Blog not found" });

    const blog = data[0];
    blog.comments = blog.comments ? blog.comments.split("||") : [];
    return res.status(200).json(blog);
  });
});

// ✅ Create a new blog
app.post("/blogs", (req, res) => {
  const { title, content, imageUrl } = req.body;
  if (!title || !content || !imageUrl) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO blogs (title, content, imageUrl, views, likes) VALUES (?, ?, ?, 0, 0)";
  db.query(sql, [title, content, imageUrl], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });
    return res.status(201).json({ id: result.insertId, title, content, imageUrl, views: 0, likes: 0 });
  });
});

// ✅ Increment blog views
app.put("/blogs/:id/views", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE blogs SET views = views + 1 WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });
    return res.status(200).json({ message: "Views updated!" });
  });
});

// ✅ Like a blog
app.put("/blogs/:id/like", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE blogs SET likes = likes + 1 WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });
    return res.status(200).json({ message: "Blog liked!" });
  });
});

// ✅ Update a blog
app.put("/blogs/:id", (req, res) => {
  const { id } = req.params;
  const { title, content, imageUrl } = req.body;

  if (!title || !content || !imageUrl) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "UPDATE blogs SET title=?, content=?, imageUrl=? WHERE id=?";
  db.query(sql, [title, content, imageUrl, id], (err) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });
    return res.status(200).json({ message: "Blog updated successfully!" });
  });
});

// ✅ Delete a blog (removes associated comments)
app.delete("/blogs/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM comments WHERE blog_id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });

    db.query("DELETE FROM blogs WHERE id=?", [id], (err) => {
      if (err) return res.status(500).json({ error: "Database error", details: err });
      return res.status(200).json({ message: "Blog and associated comments deleted successfully!" });
    });
  });
});

// ✅ Add a comment
app.post("/blogs/:id/comments", (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  const sql = "INSERT INTO comments (blog_id, comment) VALUES (?, ?)";
  db.query(sql, [id, comment], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });
    return res.status(201).json({ id: result.insertId, comment, message: "Comment added!" });
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
