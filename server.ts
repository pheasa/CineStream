import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pg from 'pg';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

import serverConfig from "./src/config/server";
import { clientEnvSchema } from "./src/config/env";

const { Pool } = pg;
const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: serverConfig.DATABASE_URL,
  ssl: serverConfig.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const JWT_SECRET = serverConfig.JWT_SECRET;

// Initialize database tables
let dbInitialized = false;

async function initDb() {
  if (!serverConfig.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. PostgreSQL features will not work.");
    return;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS metadata (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL, -- 'country', 'language', 'category'
          name TEXT NOT NULL,
          UNIQUE(type, name)
        );

        CREATE TABLE IF NOT EXISTS movies (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          thumbnail TEXT NOT NULL,
          embed_code TEXT NOT NULL,
          country TEXT NOT NULL,
          category TEXT NOT NULL,
          language TEXT NOT NULL,
          subtitle TEXT,
          tags TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          featured BOOLEAN DEFAULT FALSE
        );

        -- Ensure subtitle is optional if table already exists
        ALTER TABLE movies ALTER COLUMN subtitle DROP NOT NULL;

        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'admin'
        );
      `);

      // Initial admin user
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCount.rows[0].count) === 0 && serverConfig.VITE_ADMIN_USERNAME && serverConfig.VITE_ADMIN_PASSWORD) {
        const adminUsername = serverConfig.VITE_ADMIN_USERNAME;
        const adminPassword = serverConfig.VITE_ADMIN_PASSWORD;
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [adminUsername, hashedPassword]);
      }

      // Initial data for metadata if empty
      const metaCount = await client.query('SELECT COUNT(*) FROM metadata');
      if (parseInt(metaCount.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO metadata (type, name) VALUES
          ('category', 'Action'), ('category', 'Comedy'), ('category', 'Drama'), 
          ('category', 'Horror'), ('category', 'Sci-Fi'), ('category', 'Romance'),
          ('category', 'Thriller'), ('category', 'Animation'), ('category', 'Documentary'),
          ('country', 'Afghanistan'), ('country', 'land Islands'), ('country', 'Albania'), 
          ('country', 'Algeria'), ('country', 'American Samoa'), ('country', 'AndorrA'), 
          ('country', 'Angola'), ('country', 'Anguilla'), ('country', 'Antarctica'), 
          ('country', 'Antigua and Barbuda'), ('country', 'Argentina'), ('country', 'Armenia'), 
          ('country', 'Aruba'), ('country', 'Australia'), ('country', 'Austria'), 
          ('country', 'Azerbaijan'), ('country', 'Bahamas'), ('country', 'Bahrain'), 
          ('country', 'Bangladesh'), ('country', 'Barbados'), ('country', 'Belarus'), 
          ('country', 'Belgium'), ('country', 'Belize'), ('country', 'Benin'), 
          ('country', 'Bermuda'), ('country', 'Bhutan'), ('country', 'Bolivia'), 
          ('country', 'Bosnia and Herzegovina'), ('country', 'Botswana'), ('country', 'Bouvet Island'), 
          ('country', 'Brazil'), ('country', 'British Indian Ocean Territory'), ('country', 'Brunei Darussalam'), 
          ('country', 'Bulgaria'), ('country', 'Burkina Faso'), ('country', 'Burundi'), 
          ('country', 'Cambodia'), ('country', 'Cameroon'), ('country', 'Canada'), 
          ('country', 'Cape Verde'), ('country', 'Cayman Islands'), ('country', 'Central African Republic'), 
          ('country', 'Chad'), ('country', 'Chile'), ('country', 'China'), 
          ('country', 'Christmas Island'), ('country', 'Cocos (Keeling) Islands'), ('country', 'Colombia'), 
          ('country', 'Comoros'), ('country', 'Congo'), ('country', 'Congo, The Democratic Republic of the'), 
          ('country', 'Cook Islands'), ('country', 'Costa Rica'), ('country', 'Cote D''Ivoire'), 
          ('country', 'Croatia'), ('country', 'Cuba'), ('country', 'Cyprus'), 
          ('country', 'Czech Republic'), ('country', 'Denmark'), ('country', 'Djibouti'), 
          ('country', 'Dominica'), ('country', 'Dominican Republic'), ('country', 'Ecuador'), 
          ('country', 'Egypt'), ('country', 'El Salvador'), ('country', 'Equatorial Guinea'), 
          ('country', 'Eritrea'), ('country', 'Estonia'), ('country', 'Ethiopia'), 
          ('country', 'Falkland Islands (Malvinas)'), ('country', 'Faroe Islands'), ('country', 'Fiji'), 
          ('country', 'Finland'), ('country', 'France'), ('country', 'French Guiana'), 
          ('country', 'French Polynesia'), ('country', 'French Southern Territories'), ('country', 'Gabon'), 
          ('country', 'Gambia'), ('country', 'Georgia'), ('country', 'Germany'), 
          ('country', 'Ghana'), ('country', 'Gibraltar'), ('country', 'Greece'), 
          ('country', 'Greenland'), ('country', 'Grenada'), ('country', 'Guadeloupe'), 
          ('country', 'Guam'), ('country', 'Guatemala'), ('country', 'Guernsey'), 
          ('country', 'Guinea'), ('country', 'Guinea-Bissau'), ('country', 'Guyana'), 
          ('country', 'Haiti'), ('country', 'Heard Island and Mcdonald Islands'), ('country', 'Holy See (Vatican City State)'), 
          ('country', 'Honduras'), ('country', 'Hong Kong'), ('country', 'Hungary'), 
          ('country', 'Iceland'), ('country', 'India'), ('country', 'Indonesia'), 
          ('country', 'Iran, Islamic Republic Of'), ('country', 'Iraq'), ('country', 'Ireland'), 
          ('country', 'Isle of Man'), ('country', 'Israel'), ('country', 'Italy'), 
          ('country', 'Jamaica'), ('country', 'Japan'), ('country', 'Jersey'), 
          ('country', 'Jordan'), ('country', 'Kazakhstan'), ('country', 'Kenya'), 
          ('country', 'Kiribati'), ('country', 'Korea, Democratic People''S Republic of'), ('country', 'Korea, Republic of'), 
          ('country', 'Kuwait'), ('country', 'Kyrgyzstan'), ('country', 'Lao People''S Democratic Republic'), 
          ('country', 'Latvia'), ('country', 'Lebanon'), ('country', 'Lesotho'), 
          ('country', 'Liberia'), ('country', 'Libyan Arab Jamahiriya'), ('country', 'Liechtenstein'), 
          ('country', 'Lithuania'), ('country', 'Luxembourg'), ('country', 'Macao'), 
          ('country', 'Macedonia, The Former Yugoslav Republic of'), ('country', 'Madagascar'), ('country', 'Malawi'), 
          ('country', 'Malaysia'), ('country', 'Maldives'), ('country', 'Mali'), 
          ('country', 'Malta'), ('country', 'Marshall Islands'), ('country', 'Martinique'), 
          ('country', 'Mauritania'), ('country', 'Mauritius'), ('country', 'Mayotte'), 
          ('country', 'Mexico'), ('country', 'Micronesia, Federated States of'), ('country', 'Moldova, Republic of'), 
          ('country', 'Monaco'), ('country', 'Mongolia'), ('country', 'Montenegro'), 
          ('country', 'Montserrat'), ('country', 'Morocco'), ('country', 'Mozambique'), 
          ('country', 'Myanmar'), ('country', 'Namibia'), ('country', 'Nauru'), 
          ('country', 'Nepal'), ('country', 'Netherlands'), ('country', 'Netherlands Antilles'), 
          ('country', 'New Caledonia'), ('country', 'New Zealand'), ('country', 'Nicaragua'), 
          ('country', 'Niger'), ('country', 'Nigeria'), ('country', 'Niue'), 
          ('country', 'Norfolk Island'), ('country', 'Northern Mariana Islands'), ('country', 'Norway'), 
          ('country', 'Oman'), ('country', 'Pakistan'), ('country', 'Palau'), 
          ('country', 'Palestinian Territory, Occupied'), ('country', 'Panama'), ('country', 'Papua New Guinea'), 
          ('country', 'Paraguay'), ('country', 'Peru'), ('country', 'Philippines'), 
          ('country', 'Pitcairn'), ('country', 'Poland'), ('country', 'Portugal'), 
          ('country', 'Puerto Rico'), ('country', 'Qatar'), ('country', 'Reunion'), 
          ('country', 'Romania'), ('country', 'Russian Federation'), ('country', 'RWANDA'), 
          ('country', 'Saint Helena'), ('country', 'Saint Kitts and Nevis'), ('country', 'Saint Lucia'), 
          ('country', 'Saint Pierre and Miquelon'), ('country', 'Saint Vincent and the Grenadines'), ('country', 'Samoa'), 
          ('country', 'San Marino'), ('country', 'Sao Tome and Principe'), ('country', 'Saudi Arabia'), 
          ('country', 'Senegal'), ('country', 'Serbia'), ('country', 'Seychelles'), 
          ('country', 'Sierra Leone'), ('country', 'Singapore'), ('country', 'Slovakia'), 
          ('country', 'Slovenia'), ('country', 'Solomon Islands'), ('country', 'Somalia'), 
          ('country', 'South Africa'), ('country', 'South Georgia and the South Sandwich Islands'), ('country', 'Spain'), 
          ('country', 'Sri Lanka'), ('country', 'Sudan'), ('country', 'Suriname'), 
          ('country', 'Svalbard and Jan Mayen'), ('country', 'Swaziland'), ('country', 'Sweden'), 
          ('country', 'Switzerland'), ('country', 'Syrian Arab Republic'), ('country', 'Taiwan, Province of China'), 
          ('country', 'Tajikistan'), ('country', 'Tanzania, United Republic of'), ('country', 'Thailand'), 
          ('country', 'Timor-Leste'), ('country', 'Togo'), ('country', 'Tokelau'), 
          ('country', 'Tonga'), ('country', 'Trinidad and Tobago'), ('country', 'Tunisia'), 
          ('country', 'Turkey'), ('country', 'Turkmenistan'), ('country', 'Turks and Caicos Islands'), 
          ('country', 'Tuvalu'), ('country', 'Uganda'), ('country', 'Ukraine'), 
          ('country', 'United Arab Emirates'), ('country', 'United Kingdom'), ('country', 'United States'), 
          ('country', 'United States Minor Outlying Islands'), ('country', 'Uruguay'), ('country', 'Uzbekistan'), 
          ('country', 'Vanuatu'), ('country', 'Venezuela'), ('country', 'Viet Nam'), 
          ('country', 'Virgin Islands, British'), ('country', 'Virgin Islands, U.S.'), ('country', 'Wallis and Futuna'), 
          ('country', 'Western Sahara'), ('country', 'Yemen'), ('country', 'Zambia'), 
          ('country', 'Zimbabwe'),
          ('language', 'Afrikaans (Namibia)'), ('language', 'Afrikaans (South Africa)'), ('language', 'Afrikaans'),
          ('language', 'Akan (Ghana)'), ('language', 'Akan'), ('language', 'Albanian (Albania)'), ('language', 'Albanian'),
          ('language', 'Amharic (Ethiopia)'), ('language', 'Amharic'), ('language', 'Arabic (Algeria)'), ('language', 'Arabic (Bahrain)'),
          ('language', 'Arabic (Egypt)'), ('language', 'Arabic (Iraq)'), ('language', 'Arabic (Jordan)'), ('language', 'Arabic (Kuwait)'),
          ('language', 'Arabic (Lebanon)'), ('language', 'Arabic (Libya)'), ('language', 'Arabic (Morocco)'), ('language', 'Arabic (Oman)'),
          ('language', 'Arabic (Qatar)'), ('language', 'Arabic (Saudi Arabia)'), ('language', 'Arabic (Sudan)'), ('language', 'Arabic (Syria)'),
          ('language', 'Arabic (Tunisia)'), ('language', 'Arabic (United Arab Emirates)'), ('language', 'Arabic (Yemen)'), ('language', 'Arabic'),
          ('language', 'Armenian (Armenia)'), ('language', 'Armenian'), ('language', 'Assamese (India)'), ('language', 'Assamese'),
          ('language', 'Asu (Tanzania)'), ('language', 'Asu'), ('language', 'Azerbaijani (Cyrillic, Azerbaijan)'), ('language', 'Azerbaijani (Latin)'),
          ('language', 'Azerbaijani'), ('language', 'Bambara (Mali)'), ('language', 'Bambara'), ('language', 'Basque (Spain)'), ('language', 'Basque'),
          ('language', 'Belarusian (Belarus)'), ('language', 'Belarusian'), ('language', 'Bemba (Zambia)'), ('language', 'Bemba'),
          ('language', 'Bena (Tanzania)'), ('language', 'Bena'), ('language', 'Bengali (Bangladesh)'), ('language', 'Bengali (India)'), ('language', 'Bengali'),
          ('language', 'Bosnian (Bosnia and Herzegovina)'), ('language', 'Bosnian'), ('language', 'Bulgarian (Bulgaria)'), ('language', 'Bulgarian'),
          ('language', 'Burmese (Myanmar [Burma])'), ('language', 'Burmese'), ('language', 'Cantonese (Traditional, Hong Kong SAR China)'),
          ('language', 'Catalan (Spain)'), ('language', 'Catalan'), ('language', 'Central Morocco Tamazight (Latin)'), ('language', 'Central Morocco Tamazight'),
          ('language', 'Cherokee (United States)'), ('language', 'Cherokee'), ('language', 'Chiga (Uganda)'), ('language', 'Chiga'),
          ('language', 'Chinese (Simplified Han)'), ('language', 'Chinese (Simplified Han, China)'), ('language', 'Chinese (Traditional Han)'), ('language', 'Chinese'),
          ('language', 'Cornish (United Kingdom)'), ('language', 'Cornish'), ('language', 'Croatian (Croatia)'), ('language', 'Croatian'),
          ('language', 'Czech (Czech Republic)'), ('language', 'Czech'), ('language', 'Danish (Denmark)'), ('language', 'Danish'),
          ('language', 'Dutch (Belgium)'), ('language', 'Dutch (Netherlands)'), ('language', 'Dutch'), ('language', 'Embu (Kenya)'), ('language', 'Embu'),
          ('language', 'English (Australia)'), ('language', 'English (Canada)'), ('language', 'English (India)'), ('language', 'English (Ireland)'),
          ('language', 'English (New Zealand)'), ('language', 'English (South Africa)'), ('language', 'English (United Kingdom)'), ('language', 'English (United States)'),
          ('language', 'English'), ('language', 'Esperanto'), ('language', 'Estonian (Estonia)'), ('language', 'Estonian'),
          ('language', 'Ewe (Ghana)'), ('language', 'Ewe'), ('language', 'Faroese (Faroe Islands)'), ('language', 'Faroese'),
          ('language', 'Filipino (Philippines)'), ('language', 'Filipino'), ('language', 'Finnish (Finland)'), ('language', 'Finnish'),
          ('language', 'French (Belgium)'), ('language', 'French (Canada)'), ('language', 'French (France)'), ('language', 'French (Switzerland)'), ('language', 'French'),
          ('language', 'Fulah (Senegal)'), ('language', 'Fulah'), ('language', 'Galician (Spain)'), ('language', 'Galician'),
          ('language', 'Ganda (Uganda)'), ('language', 'Ganda'), ('language', 'Georgian (Georgia)'), ('language', 'Georgian'),
          ('language', 'German (Austria)'), ('language', 'German (Germany)'), ('language', 'German (Switzerland)'), ('language', 'German'),
          ('language', 'Greek (Greece)'), ('language', 'Greek'), ('language', 'Gujarati (India)'), ('language', 'Gujarati'),
          ('language', 'Gusii (Kenya)'), ('language', 'Gusii'), ('language', 'Hausa (Latin)'), ('language', 'Hausa'),
          ('language', 'Hawaiian (United States)'), ('language', 'Hawaiian'), ('language', 'Hebrew (Israel)'), ('language', 'Hebrew'),
          ('language', 'Hindi (India)'), ('language', 'Hindi'), ('language', 'Hungarian (Hungary)'), ('language', 'Hungarian'),
          ('language', 'Icelandic (Iceland)'), ('language', 'Icelandic'), ('language', 'Igbo (Nigeria)'), ('language', 'Igbo'),
          ('language', 'Indonesian (Indonesia)'), ('language', 'Indonesian'), ('language', 'Irish (Ireland)'), ('language', 'Irish'),
          ('language', 'Italian (Italy)'), ('language', 'Italian (Switzerland)'), ('language', 'Italian'), ('language', 'Japanese (Japan)'), ('language', 'Japanese'),
          ('language', 'Kabuverdianu (Cape Verde)'), ('language', 'Kabuverdianu'), ('language', 'Kabyle (Algeria)'), ('language', 'Kabyle'),
          ('language', 'Kalaallisut (Greenland)'), ('language', 'Kalaallisut'), ('language', 'Kalenjin (Kenya)'), ('language', 'Kalenjin'),
          ('language', 'Kamba (Kenya)'), ('language', 'Kamba'), ('language', 'Kannada (India)'), ('language', 'Kannada'),
          ('language', 'Kazakh (Cyrillic)'), ('language', 'Kazakh'), ('language', 'Khmer (Cambodia)'), ('language', 'Khmer'),
          ('language', 'Kikuyu (Kenya)'), ('language', 'Kikuyu'), ('language', 'Kinyarwanda (Rwanda)'), ('language', 'Kinyarwanda'),
          ('language', 'Konkani (India)'), ('language', 'Konkani'), ('language', 'Korean (South Korea)'), ('language', 'Korean'),
          ('language', 'Koyra Chiini (Mali)'), ('language', 'Koyra Chiini'), ('language', 'Koyraboro Senni (Mali)'), ('language', 'Koyraboro Senni'),
          ('language', 'Langi (Tanzania)'), ('language', 'Langi'), ('language', 'Latvian (Latvia)'), ('language', 'Latvian'),
          ('language', 'Lithuanian (Lithuania)'), ('language', 'Lithuanian'), ('language', 'Luo (Kenya)'), ('language', 'Luo'),
          ('language', 'Luyia (Kenya)'), ('language', 'Luyia'), ('language', 'Macedonian (Macedonia)'), ('language', 'Macedonian'),
          ('language', 'Machame (Tanzania)'), ('language', 'Machame'), ('language', 'Makonde (Tanzania)'), ('language', 'Makonde'),
          ('language', 'Malagasy (Madagascar)'), ('language', 'Malagasy'), ('language', 'Malay (Brunei)'), ('language', 'Malay (Malaysia)'), ('language', 'Malay'),
          ('language', 'Malayalam (India)'), ('language', 'Malayalam'), ('language', 'Maltese (Malta)'), ('language', 'Maltese'),
          ('language', 'Manx (United Kingdom)'), ('language', 'Manx'), ('language', 'Marathi (India)'), ('language', 'Marathi'),
          ('language', 'Masai (Kenya)'), ('language', 'Masai'), ('language', 'Meru (Kenya)'), ('language', 'Meru'),
          ('language', 'Morisyen (Mauritius)'), ('language', 'Morisyen'), ('language', 'Nama (Namibia)'), ('language', 'Nama'),
          ('language', 'Nepali (India)'), ('language', 'Nepali (Nepal)'), ('language', 'Nepali'), ('language', 'North Ndebele (Zimbabwe)'), ('language', 'North Ndebele'),
          ('language', 'Norwegian Bokmål (Norway)'), ('language', 'Norwegian Bokmål'), ('language', 'Norwegian Nynorsk (Norway)'), ('language', 'Norwegian Nynorsk'),
          ('language', 'Nyankole (Uganda)'), ('language', 'Nyankole'), ('language', 'Oriya (India)'), ('language', 'Oriya'),
          ('language', 'Oromo (Ethiopia)'), ('language', 'Oromo'), ('language', 'Pashto (Afghanistan)'), ('language', 'Pashto'),
          ('language', 'Persian (Afghanistan)'), ('language', 'Persian (Iran)'), ('language', 'Persian'), ('language', 'Polish (Poland)'), ('language', 'Polish'),
          ('language', 'Portuguese (Brazil)'), ('language', 'Portuguese (Portugal)'), ('language', 'Portuguese'), ('language', 'Punjabi (Arabic)'),
          ('language', 'Punjabi (Gurmukhi)'), ('language', 'Punjabi'), ('language', 'Romanian (Moldova)'), ('language', 'Romanian (Romania)'), ('language', 'Romanian'),
          ('language', 'Romansh (Switzerland)'), ('language', 'Romansh'), ('language', 'Rombo (Tanzania)'), ('language', 'Rombo'),
          ('language', 'Russian (Russia)'), ('language', 'Russian (Ukraine)'), ('language', 'Russian'), ('language', 'Rwa (Tanzania)'), ('language', 'Rwa'),
          ('language', 'Samburu (Kenya)'), ('language', 'Samburu'), ('language', 'Sango (Central African Republic)'), ('language', 'Sango'),
          ('language', 'Sena (Mozambique)'), ('language', 'Sena'), ('language', 'Serbian (Cyrillic)'), ('language', 'Serbian (Latin)'), ('language', 'Serbian'),
          ('language', 'Shona (Zimbabwe)'), ('language', 'Shona'), ('language', 'Sichuan Yi (China)'), ('language', 'Sichuan Yi'),
          ('language', 'Sinhala (Sri Lanka)'), ('language', 'Sinhala'), ('language', 'Slovak (Slovakia)'), ('language', 'Slovak'),
          ('language', 'Slovenian (Slovenia)'), ('language', 'Slovenian'), ('language', 'Soga (Uganda)'), ('language', 'Soga'),
          ('language', 'Somali (Somalia)'), ('language', 'Somali'), ('language', 'Spanish (Argentina)'), ('language', 'Spanish (Mexico)'),
          ('language', 'Spanish (Spain)'), ('language', 'Spanish (United States)'), ('language', 'Spanish'), ('language', 'Swahili (Kenya)'),
          ('language', 'Swahili (Tanzania)'), ('language', 'Swahili'), ('language', 'Swedish (Sweden)'), ('language', 'Swedish'),
          ('language', 'Swiss German (Switzerland)'), ('language', 'Swiss German'), ('language', 'Tachelhit (Latin)'), ('language', 'Tachelhit'),
          ('language', 'Taita (Kenya)'), ('language', 'Taita'), ('language', 'Tamil (India)'), ('language', 'Tamil'),
          ('language', 'Telugu (India)'), ('language', 'Telugu'), ('language', 'Teso (Uganda)'), ('language', 'Teso'),
          ('language', 'Thai (Thailand)'), ('language', 'Thai'), ('language', 'Tibetan (China)'), ('language', 'Tibetan'),
          ('language', 'Tigrinya (Eritrea)'), ('language', 'Tigrinya'), ('language', 'Tonga (Tonga)'), ('language', 'Tonga'),
          ('language', 'Turkish (Turkey)'), ('language', 'Turkish'), ('language', 'Ukrainian (Ukraine)'), ('language', 'Ukrainian'),
          ('language', 'Urdu (India)'), ('language', 'Urdu (Pakistan)'), ('language', 'Urdu'), ('language', 'Uzbek (Arabic)'),
          ('language', 'Uzbek (Cyrillic)'), ('language', 'Uzbek (Latin)'), ('language', 'Uzbek'), ('language', 'Vietnamese (Vietnam)'), ('language', 'Vietnamese'),
          ('language', 'Vunjo (Tanzania)'), ('language', 'Vunjo'), ('language', 'Welsh (United Kingdom)'), ('language', 'Welsh'),
          ('language', 'Yoruba (Nigeria)'), ('language', 'Yoruba'), ('language', 'Zulu (South Africa)'), ('language', 'Zulu')
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

  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  // Middleware to check database connectivity
  app.use("/api", (req, res, next) => {
    if (!serverConfig.DATABASE_URL) {
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
  
  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];

      if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err) {
      res.status(500).json({ error: "Auth error" });
    }
  });

  // Movies
  app.get("/api/movies", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "all";
    const country = (req.query.country as string) || "all";
    const language = (req.query.language as string) || "all";
    const subtitle = (req.query.subtitle as string) || "all";
    const offset = (page - 1) * limit;

    try {
      let query = 'SELECT * FROM movies';
      let countQuery = 'SELECT COUNT(*) FROM movies';
      let params: any[] = [];
      let conditions: string[] = [];

      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(title ILIKE $${params.length} OR tags ILIKE $${params.length})`);
      }

      if (category !== 'all') {
        params.push(category);
        conditions.push(`category = $${params.length}`);
      }

      if (country !== 'all') {
        params.push(country);
        conditions.push(`country = $${params.length}`);
      }

      if (language !== 'all') {
        params.push(language);
        conditions.push(`language = $${params.length}`);
      }

      if (subtitle !== 'all') {
        params.push(subtitle);
        conditions.push(`subtitle = $${params.length}`);
      }

      if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      const queryParams = [...params, limit, offset];

      const [result, totalResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, params)
      ]);

      const total = parseInt(totalResult.rows[0].count);
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

      res.json({
        data: movies,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (err) {
      console.error('Movies fetch error:', err);
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

  app.post("/api/movies", authenticateToken, async (req, res) => {
    const { title, thumbnail, embedCode, country, category, language, subtitle, tags } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO movies (title, thumbnail, embed_code, country, category, language, subtitle, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [title, thumbnail, embedCode, country, category, language, subtitle, tags]
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

  app.put("/api/movies/:id", authenticateToken, async (req, res) => {
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

  app.delete("/api/movies/:id", authenticateToken, async (req, res) => {
    try {
      await pool.query('DELETE FROM movies WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Metadata (Languages, Countries, Categories, etc.)
  app.get("/api/metadata", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const type = (req.query.type as string) || "all";
    const offset = (page - 1) * limit;

    try {
      let query = 'SELECT * FROM metadata';
      let countQuery = 'SELECT COUNT(*) FROM metadata';
      let params: any[] = [];
      let conditions: string[] = [];

      if (type && type !== 'all') {
        params.push(type);
        conditions.push(`type = $${params.length}`);
      }

      if (search) {
        params.push(`%${search}%`);
        conditions.push(`name ILIKE $${params.length}`);
      }

      if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
      }

      query += ' ORDER BY name ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      const queryParams = [...params, limit, offset];

      const [result, totalResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, params)
      ]);

      const total = parseInt(totalResult.rows[0].count);
      res.json({
        data: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (err) {
      console.error('Metadata fetch error:', err);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/metadata", authenticateToken, async (req, res) => {
    const { type, name } = req.body;
    try {
      const result = await pool.query('INSERT INTO metadata (type, name) VALUES ($1, $2) RETURNING *', [type, name]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/metadata/:id", authenticateToken, async (req, res) => {
    const { type, name } = req.body;
    try {
      const result = await pool.query('UPDATE metadata SET type = $1, name = $2 WHERE id = $3 RETURNING *', [type, name, req.params.id]);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: "Metadata not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/metadata/:id", authenticateToken, async (req, res) => {
    try {
      await pool.query('DELETE FROM metadata WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Upload Proxy Routes
  app.post("/api/upload/litterbox", authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('time', '24h');
      formData.append('fileToUpload', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post('https://litterbox.catbox.moe/resources/internals/api.php', formData, {
        headers: formData.getHeaders(),
      });

      res.json({ url: response.data });
    } catch (error) {
      console.error('Litterbox upload error:', error);
      res.status(500).json({ error: "Litterbox upload failed" });
    }
  });

  app.post("/api/upload/catbox", authenticateToken, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const userHash = serverConfig.CATBOX_USER_HASH;
    const albumShort = serverConfig.CATBOX_ALBUM_SHORT;

    try {
      // 1. Upload from URL to Catbox
      const formData = new FormData();
      formData.append('reqtype', 'urlupload');
      formData.append('userhash', userHash);
      formData.append('url', url);

      const uploadResponse = await axios.post('https://catbox.moe/user/api.php', formData, {
        headers: formData.getHeaders(),
      });

      const permanentUrl = uploadResponse.data;
      if (typeof permanentUrl !== 'string' || !permanentUrl.startsWith('http')) {
        throw new Error('Invalid response from Catbox: ' + permanentUrl);
      }

      // 2. Add to album
      const fileName = permanentUrl.split('/').pop();
      const albumData = new FormData();
      albumData.append('reqtype', 'addtoalbum');
      albumData.append('userhash', userHash);
      albumData.append('short', albumShort);
      albumData.append('files', fileName);

      await axios.post('https://catbox.moe/user/api.php', albumData, {
        headers: albumData.getHeaders(),
      });

      res.json({ url: permanentUrl });
    } catch (error) {
      console.error('Catbox upload/album error:', error);
      res.status(500).json({ error: "Catbox processing failed" });
    }
  });

  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const movies = await pool.query('SELECT COUNT(*) FROM movies');
      const metadata = await pool.query('SELECT COUNT(*) FROM metadata');
      res.json({
        movies: parseInt(movies.rows[0].count),
        metadata: parseInt(metadata.rows[0].count)
      });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Vite middleware for development
  if (serverConfig.NODE_ENV !== "production") {
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

  const port = serverConfig.PORT;

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
