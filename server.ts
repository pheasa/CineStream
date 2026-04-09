import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
let dbInitialized = false;

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. PostgreSQL features will not work.");
    return;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS countries (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS movies (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          thumbnail TEXT NOT NULL,
          embed_code TEXT NOT NULL,
          country TEXT NOT NULL,
          category TEXT NOT NULL,
          language TEXT NOT NULL,
          subtitle TEXT NOT NULL,
          tags TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          featured BOOLEAN DEFAULT FALSE
        );
      `);

      // Initial data for categories if empty
      const catCount = await client.query('SELECT COUNT(*) FROM categories');
      if (parseInt(catCount.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO categories (id, name) VALUES
          ('1', 'Action'), ('2', 'Comedy'), ('3', 'Drama'), ('4', 'Horror'), ('5', 'Sci-Fi')
        `);
      }

      // Initial data for countries if empty
      const countryCount = await client.query('SELECT COUNT(*) FROM countries');
      if (parseInt(countryCount.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO countries (id, name) VALUES
          ('1', 'USA'), ('2', 'UK'), ('3', 'Canada'), ('4', 'France'), ('5', 'Japan')
        `);
      }

      dbInitialized = true;
      console.log("Database initialized successfully.");
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

async function startServer() {
  await initDb();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to check database connectivity
  app.use("/api", (req, res, next) => {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ 
        error: "Database not configured", 
        message: "Please set the DATABASE_URL environment variable in the settings menu." 
      });
    }
    if (!dbInitialized) {
      return res.status(503).json({ 
        error: "Database initializing", 
        message: "The database is still initializing. Please try again in a few seconds." 
      });
    }
    next();
  });

  // API Routes
  
  // Movies
  app.get("/api/movies", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM movies ORDER BY created_at DESC');
      // Map snake_case to camelCase for frontend
      const movies = result.rows.map(m => ({
        id: m.id,
        title: m.title,
        thumbnail: m.thumbnail,
        embedCode: m.embed_code,
        country: m.country,
        category: m.category,
        language: m.language,
        subtitle: m.subtitle,
        tags: m.tags,
        createdAt: m.created_at,
        featured: m.featured
      }));
      res.json(movies);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
      if (result.rows.length > 0) {
        const m = result.rows[0];
        res.json({
          id: m.id,
          title: m.title,
          thumbnail: m.thumbnail,
          embedCode: m.embed_code,
          country: m.country,
          category: m.category,
          language: m.language,
          subtitle: m.subtitle,
          tags: m.tags,
          createdAt: m.created_at,
          featured: m.featured
        });
      } else {
        res.status(404).json({ error: "Movie not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/movies", async (req, res) => {
    const { title, thumbnail, embedCode, country, category, language, subtitle, tags } = req.body;
    const id = Date.now().toString();
    try {
      const result = await pool.query(
        'INSERT INTO movies (id, title, thumbnail, embed_code, country, category, language, subtitle, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [id, title, thumbnail, embedCode, country, category, language, subtitle, tags]
      );
      const m = result.rows[0];
      res.status(201).json({
        id: m.id,
        title: m.title,
        thumbnail: m.thumbnail,
        embedCode: m.embed_code,
        country: m.country,
        category: m.category,
        language: m.language,
        subtitle: m.subtitle,
        tags: m.tags,
        createdAt: m.created_at,
        featured: m.featured
      });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/movies/:id", async (req, res) => {
    const { title, thumbnail, embedCode, country, category, language, subtitle, tags } = req.body;
    try {
      const result = await pool.query(
        'UPDATE movies SET title = $1, thumbnail = $2, embed_code = $3, country = $4, category = $5, language = $6, subtitle = $7, tags = $8 WHERE id = $9 RETURNING *',
        [title, thumbnail, embedCode, country, category, language, subtitle, tags, req.params.id]
      );
      if (result.rows.length > 0) {
        const m = result.rows[0];
        res.json({
          id: m.id,
          title: m.title,
          thumbnail: m.thumbnail,
          embedCode: m.embed_code,
          country: m.country,
          category: m.category,
          language: m.language,
          subtitle: m.subtitle,
          tags: m.tags,
          createdAt: m.created_at,
          featured: m.featured
        });
      } else {
        res.status(404).json({ error: "Movie not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/movies/:id", async (req, res) => {
    try {
      await pool.query('DELETE FROM movies WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    const { name } = req.body;
    const id = Date.now().toString();
    try {
      const result = await pool.query('INSERT INTO categories (id, name) VALUES ($1, $2) RETURNING *', [id, name]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    const { name } = req.body;
    try {
      const result = await pool.query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING *', [name, req.params.id]);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: "Category not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const catResult = await pool.query('SELECT name FROM categories WHERE id = $1', [req.params.id]);
      if (catResult.rows.length === 0) return res.status(404).json({ error: "Category not found" });

      const movieResult = await pool.query('SELECT COUNT(*) FROM movies WHERE category = $1', [catResult.rows[0].name]);
      if (parseInt(movieResult.rows[0].count) > 0) {
        return res.status(400).json({ error: "Cannot delete category with associated movies" });
      }

      await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Countries
  app.get("/api/countries", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM countries ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/countries", async (req, res) => {
    const { name } = req.body;
    const id = Date.now().toString();
    try {
      const result = await pool.query('INSERT INTO countries (id, name) VALUES ($1, $2) RETURNING *', [id, name]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/countries/:id", async (req, res) => {
    const { name } = req.body;
    try {
      const result = await pool.query('UPDATE countries SET name = $1 WHERE id = $2 RETURNING *', [name, req.params.id]);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: "Country not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/countries/:id", async (req, res) => {
    try {
      const countryResult = await pool.query('SELECT name FROM countries WHERE id = $1', [req.params.id]);
      if (countryResult.rows.length === 0) return res.status(404).json({ error: "Country not found" });

      const movieResult = await pool.query('SELECT COUNT(*) FROM movies WHERE country = $1', [countryResult.rows[0].name]);
      if (parseInt(movieResult.rows[0].count) > 0) {
        return res.status(400).json({ error: "Cannot delete country with associated movies" });
      }

      await pool.query('DELETE FROM countries WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const movies = await pool.query('SELECT COUNT(*) FROM movies');
      const categories = await pool.query('SELECT COUNT(*) FROM categories');
      const countries = await pool.query('SELECT COUNT(*) FROM countries');
      res.json({
        movies: parseInt(movies.rows[0].count),
        categories: parseInt(categories.rows[0].count),
        countries: parseInt(countries.rows[0].count)
      });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
