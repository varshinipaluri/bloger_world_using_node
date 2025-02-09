import { useState, useEffect } from "react";
import axios from "axios";

export default function BlogApp() {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/blogs");
      setBlogs(res.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  const createBlog = async () => {
    const title = prompt("Enter blog title:");
    const content = prompt("Enter blog content:");
    const imageUrl = prompt("Enter image URL:");
    if (title && content && imageUrl) {
      try {
        await axios.post("http://localhost:5000/blogs", { title, content, imageUrl });
        fetchBlogs();
      } catch (error) {
        console.error("Error creating blog:", error);
      }
    }
  };

  const openBlogPopup = async (blog) => {
    try {
      await axios.put(`http://localhost:5000/blogs/${blog.id}/views`);
  
      // Instantly update views count in blog list
      setBlogs((prevBlogs) =>
        prevBlogs.map((b) =>
          b.id === blog.id ? { ...b, views: b.views + 1 } : b
        )
      );
  
      setSelectedBlog({ ...blog, views: blog.views + 1 });
    } catch (error) {
      console.error("Error updating views:", error);
    }
  };
  
  const closeBlogPopup = () => setSelectedBlog(null);

  const updateBlog = async (id, title, content, imageUrl) => {
    const newTitle = prompt("Update blog title:", title);
    const newContent = prompt("Update blog content:", content);
    const newImageUrl = prompt("Update image URL:", imageUrl);
    if (newTitle && newContent && newImageUrl) {
      try {
        await axios.put(`http://localhost:5000/blogs/${id}`, { title: newTitle, content: newContent, imageUrl: newImageUrl });
        fetchBlogs();
      } catch (error) {
        console.error("Error updating blog:", error);
      }
    }
  };

  const deleteBlog = async (id) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      try {
        await axios.delete(`http://localhost:5000/blogs/${id}`);
        fetchBlogs();
        closeBlogPopup();
      } catch (error) {
        console.error("Error deleting blog:", error);
      }
    }
  };

  const likeBlog = async (id) => {
    try {
      if (selectedBlog && selectedBlog.id === id) {
        setSelectedBlog((prev) => ({ ...prev, likes: prev.likes + 1 }));
      }

      setBlogs((prevBlogs) =>
        prevBlogs.map((blog) =>
          blog.id === id ? { ...blog, likes: blog.likes + 1 } : blog
        )
      );

      await axios.put(`http://localhost:5000/blogs/${id}/like`);
    } catch (error) {
      console.error("Error liking blog:", error);
    }
  };

  const addComment = async (id) => {
    const comment = prompt("Enter your comment:");
    if (comment) {
      try {
        await axios.post(`http://localhost:5000/blogs/${id}/comments`, { comment });
        fetchBlogs();
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-blue-500 text-white p-5">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold">Bloger's World</h1>
          <button onClick={createBlog} className="bg-white text-black px-4 py-2 rounded mt-6 shadow-md">Create Blog</button>
        </div>
      </header>

      <main className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blogs.map((blog) => (
          <div key={blog.id} className="bg-white p-4 rounded shadow relative">
            <img src={blog.imageUrl} alt="Blog" className="w-full h-50 object-cover rounded mb-2" />
            <h2 className="text-xl font-bold">{blog.title}</h2>
            <p className="text-gray-500">👀 {blog.views} | ❤️ {blog.likes}</p>
            <p className="text-gray-700 mt-2">{blog.content.substring(0, 100)}...</p>
            <button onClick={() => likeBlog(blog.id)} className="bg-pink-500 text-white px-3 py-1 rounded mr-2">Like</button>
            <button onClick={() => addComment(blog.id)} className="bg-green-500 text-white px-3 py-1 rounded mr-2">Comment</button>
            <button onClick={() => updateBlog(blog.id, blog.title, blog.content, blog.imageUrl)} className="bg-yellow-500 text-black px-3 py-1 rounded mr-2">Update</button>
            <button onClick={() => deleteBlog(blog.id)} className="bg-red-500 text-white px-3 py-1 rounded mr-4">Delete</button>
            <button onClick={() => openBlogPopup(blog)} className="bg-blue-500 text-white px-3 py-1 rounded">Read More</button>

            {/* Comments Display */}
            <div className="mt-2">
              <h3 className="font-bold">Comments:</h3>
              {blog.comments && blog.comments.length > 0 ? (
                blog.comments.map((comment, i) => (
                  <p key={i} className="text-gray-600">- {comment.text || comment}</p>
                ))
              ) : (
                <p className="text-gray-500">No comments yet.</p>
              )}
            </div>
          </div>
        ))}
      </main>

      {selectedBlog && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl relative">
            <button onClick={closeBlogPopup} className="absolute top-3 right-3 text-2xl font-bold text-gray-700 hover:text-gray-900">✖</button>
            <h2 className="text-2xl font-bold">{selectedBlog.title}</h2>
            <img src={selectedBlog.imageUrl} alt="Blog" className="w-full h-auto object-cover rounded my-2" />
            <p className="text-gray-700">{selectedBlog.content}</p>
            <p className="text-gray-500">👀 {selectedBlog.views} | ❤️ {selectedBlog.likes}</p>
            <button onClick={() => likeBlog(selectedBlog.id)} className="bg-pink-500 text-white px-3 py-1 rounded mr-2">Like</button>
            <button onClick={() => addComment(selectedBlog.id)} className="bg-green-500 text-white px-3 py-1 rounded mr-2">Comment</button>
            <button onClick={() => updateBlog(selectedBlog.id, selectedBlog.title, selectedBlog.content, selectedBlog.imageUrl)} className="bg-yellow-500 text-black px-3 py-1 rounded mr-2">Update</button>
            <button onClick={() => deleteBlog(selectedBlog.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>

            {/* Comments Display in Popup */}
            <div className="mt-2">
              <h3 className="font-bold">Comments:</h3>
              {selectedBlog.comments && selectedBlog.comments.length > 0 ? (
                selectedBlog.comments.map((comment, i) => (
                  <p key={i} className="text-gray-600">- {comment.text || comment}</p>
                ))
              ) : (
                <p className="text-gray-500">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
