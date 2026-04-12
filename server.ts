import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pg from 'pg';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';

const { Pool } = pg;
const upload = multer({ storage: multer.memoryStorage() });

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
        CREATE TABLE IF NOT EXISTS metadata (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL, -- 'country', 'language', 'category'
          name TEXT NOT NULL,
          UNIQUE(type, name)
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

      // Initial data for metadata if empty
      const metaCount = await client.query('SELECT COUNT(*) FROM metadata');
      if (parseInt(metaCount.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO metadata (id, type, name) VALUES
          ('c1', 'category', 'Action'), ('c2', 'category', 'Comedy'), ('c3', 'category', 'Drama'), 
          ('c4', 'category', 'Horror'), ('c5', 'category', 'Sci-Fi'), ('c6', 'category', 'Romance'),
          ('c7', 'category', 'Thriller'), ('c8', 'category', 'Animation'), ('c9', 'category', 'Documentary'),
          ('AF', 'country', 'Afghanistan'), ('AX', 'country', 'land Islands'), ('AL', 'country', 'Albania'), 
          ('DZ', 'country', 'Algeria'), ('AS', 'country', 'American Samoa'), ('AD', 'country', 'AndorrA'), 
          ('AO', 'country', 'Angola'), ('AI', 'country', 'Anguilla'), ('AQ', 'country', 'Antarctica'), 
          ('AG', 'country', 'Antigua and Barbuda'), ('AR', 'country', 'Argentina'), ('AM', 'country', 'Armenia'), 
          ('AW', 'country', 'Aruba'), ('AU', 'country', 'Australia'), ('AT', 'country', 'Austria'), 
          ('AZ', 'country', 'Azerbaijan'), ('BS', 'country', 'Bahamas'), ('BH', 'country', 'Bahrain'), 
          ('BD', 'country', 'Bangladesh'), ('BB', 'country', 'Barbados'), ('BY', 'country', 'Belarus'), 
          ('BE', 'country', 'Belgium'), ('BZ', 'country', 'Belize'), ('BJ', 'country', 'Benin'), 
          ('BM', 'country', 'Bermuda'), ('BT', 'country', 'Bhutan'), ('BO', 'country', 'Bolivia'), 
          ('BA', 'country', 'Bosnia and Herzegovina'), ('BW', 'country', 'Botswana'), ('BV', 'country', 'Bouvet Island'), 
          ('BR', 'country', 'Brazil'), ('IO', 'country', 'British Indian Ocean Territory'), ('BN', 'country', 'Brunei Darussalam'), 
          ('BG', 'country', 'Bulgaria'), ('BF', 'country', 'Burkina Faso'), ('BI', 'country', 'Burundi'), 
          ('KH', 'country', 'Cambodia'), ('CM', 'country', 'Cameroon'), ('CA', 'country', 'Canada'), 
          ('CV', 'country', 'Cape Verde'), ('KY', 'country', 'Cayman Islands'), ('CF', 'country', 'Central African Republic'), 
          ('TD', 'country', 'Chad'), ('CL', 'country', 'Chile'), ('CN', 'country', 'China'), 
          ('CX', 'country', 'Christmas Island'), ('CC', 'country', 'Cocos (Keeling) Islands'), ('CO', 'country', 'Colombia'), 
          ('KM', 'country', 'Comoros'), ('CG', 'country', 'Congo'), ('CD', 'country', 'Congo, The Democratic Republic of the'), 
          ('CK', 'country', 'Cook Islands'), ('CR', 'country', 'Costa Rica'), ('CI', 'country', 'Cote D''Ivoire'), 
          ('HR', 'country', 'Croatia'), ('CU', 'country', 'Cuba'), ('CY', 'country', 'Cyprus'), 
          ('CZ', 'country', 'Czech Republic'), ('DK', 'country', 'Denmark'), ('DJ', 'country', 'Djibouti'), 
          ('DM', 'country', 'Dominica'), ('DO', 'country', 'Dominican Republic'), ('EC', 'country', 'Ecuador'), 
          ('EG', 'country', 'Egypt'), ('SV', 'country', 'El Salvador'), ('GQ', 'country', 'Equatorial Guinea'), 
          ('ER', 'country', 'Eritrea'), ('EE', 'country', 'Estonia'), ('ET', 'country', 'Ethiopia'), 
          ('FK', 'country', 'Falkland Islands (Malvinas)'), ('FO', 'country', 'Faroe Islands'), ('FJ', 'country', 'Fiji'), 
          ('FI', 'country', 'Finland'), ('FR', 'country', 'France'), ('GF', 'country', 'French Guiana'), 
          ('PF', 'country', 'French Polynesia'), ('TF', 'country', 'French Southern Territories'), ('GA', 'country', 'Gabon'), 
          ('GM', 'country', 'Gambia'), ('GE', 'country', 'Georgia'), ('DE', 'country', 'Germany'), 
          ('GH', 'country', 'Ghana'), ('GI', 'country', 'Gibraltar'), ('GR', 'country', 'Greece'), 
          ('GL', 'country', 'Greenland'), ('GD', 'country', 'Grenada'), ('GP', 'country', 'Guadeloupe'), 
          ('GU', 'country', 'Guam'), ('GT', 'country', 'Guatemala'), ('GG', 'country', 'Guernsey'), 
          ('GN', 'country', 'Guinea'), ('GW', 'country', 'Guinea-Bissau'), ('GY', 'country', 'Guyana'), 
          ('HT', 'country', 'Haiti'), ('HM', 'country', 'Heard Island and Mcdonald Islands'), ('VA', 'country', 'Holy See (Vatican City State)'), 
          ('HN', 'country', 'Honduras'), ('HK', 'country', 'Hong Kong'), ('HU', 'country', 'Hungary'), 
          ('IS', 'country', 'Iceland'), ('IN', 'country', 'India'), ('ID', 'country', 'Indonesia'), 
          ('IR', 'country', 'Iran, Islamic Republic Of'), ('IQ', 'country', 'Iraq'), ('IE', 'country', 'Ireland'), 
          ('IM', 'country', 'Isle of Man'), ('IL', 'country', 'Israel'), ('IT', 'country', 'Italy'), 
          ('JM', 'country', 'Jamaica'), ('JP', 'country', 'Japan'), ('JE', 'country', 'Jersey'), 
          ('JO', 'country', 'Jordan'), ('KZ', 'country', 'Kazakhstan'), ('KE', 'country', 'Kenya'), 
          ('KI', 'country', 'Kiribati'), ('KP', 'country', 'Korea, Democratic People''S Republic of'), ('KR', 'country', 'Korea, Republic of'), 
          ('KW', 'country', 'Kuwait'), ('KG', 'country', 'Kyrgyzstan'), ('LA', 'country', 'Lao People''S Democratic Republic'), 
          ('LV', 'country', 'Latvia'), ('LB', 'country', 'Lebanon'), ('LS', 'country', 'Lesotho'), 
          ('LR', 'country', 'Liberia'), ('LY', 'country', 'Libyan Arab Jamahiriya'), ('LI', 'country', 'Liechtenstein'), 
          ('LT', 'country', 'Lithuania'), ('LU', 'country', 'Luxembourg'), ('MO', 'country', 'Macao'), 
          ('MK', 'country', 'Macedonia, The Former Yugoslav Republic of'), ('MG', 'country', 'Madagascar'), ('MW', 'country', 'Malawi'), 
          ('MY', 'country', 'Malaysia'), ('MV', 'country', 'Maldives'), ('ML', 'country', 'Mali'), 
          ('MT', 'country', 'Malta'), ('MH', 'country', 'Marshall Islands'), ('MQ', 'country', 'Martinique'), 
          ('MR', 'country', 'Mauritania'), ('MU', 'country', 'Mauritius'), ('YT', 'country', 'Mayotte'), 
          ('MX', 'country', 'Mexico'), ('FM', 'country', 'Micronesia, Federated States of'), ('MD', 'country', 'Moldova, Republic of'), 
          ('MC', 'country', 'Monaco'), ('MN', 'country', 'Mongolia'), ('ME', 'country', 'Montenegro'), 
          ('MS', 'country', 'Montserrat'), ('MA', 'country', 'Morocco'), ('MZ', 'country', 'Mozambique'), 
          ('MM', 'country', 'Myanmar'), ('NA', 'country', 'Namibia'), ('NR', 'country', 'Nauru'), 
          ('NP', 'country', 'Nepal'), ('NL', 'country', 'Netherlands'), ('AN', 'country', 'Netherlands Antilles'), 
          ('NC', 'country', 'New Caledonia'), ('NZ', 'country', 'New Zealand'), ('NI', 'country', 'Nicaragua'), 
          ('NE', 'country', 'Niger'), ('NG', 'country', 'Nigeria'), ('NU', 'country', 'Niue'), 
          ('NF', 'country', 'Norfolk Island'), ('MP', 'country', 'Northern Mariana Islands'), ('NO', 'country', 'Norway'), 
          ('OM', 'country', 'Oman'), ('PK', 'country', 'Pakistan'), ('PW', 'country', 'Palau'), 
          ('PS', 'country', 'Palestinian Territory, Occupied'), ('PA', 'country', 'Panama'), ('PG', 'country', 'Papua New Guinea'), 
          ('PY', 'country', 'Paraguay'), ('PE', 'country', 'Peru'), ('PH', 'country', 'Philippines'), 
          ('PN', 'country', 'Pitcairn'), ('PL', 'country', 'Poland'), ('PT', 'country', 'Portugal'), 
          ('PR', 'country', 'Puerto Rico'), ('QA', 'country', 'Qatar'), ('RE', 'country', 'Reunion'), 
          ('RO', 'country', 'Romania'), ('RU', 'country', 'Russian Federation'), ('RW', 'country', 'RWANDA'), 
          ('SH', 'country', 'Saint Helena'), ('KN', 'country', 'Saint Kitts and Nevis'), ('LC', 'country', 'Saint Lucia'), 
          ('PM', 'country', 'Saint Pierre and Miquelon'), ('VC', 'country', 'Saint Vincent and the Grenadines'), ('WS', 'country', 'Samoa'), 
          ('SM', 'country', 'San Marino'), ('ST', 'country', 'Sao Tome and Principe'), ('SA', 'country', 'Saudi Arabia'), 
          ('SN', 'country', 'Senegal'), ('RS', 'country', 'Serbia'), ('SC', 'country', 'Seychelles'), 
          ('SL', 'country', 'Sierra Leone'), ('SG', 'country', 'Singapore'), ('SK', 'country', 'Slovakia'), 
          ('SI', 'country', 'Slovenia'), ('SB', 'country', 'Solomon Islands'), ('SO', 'country', 'Somalia'), 
          ('ZA', 'country', 'South Africa'), ('GS', 'country', 'South Georgia and the South Sandwich Islands'), ('ES', 'country', 'Spain'), 
          ('LK', 'country', 'Sri Lanka'), ('SD', 'country', 'Sudan'), ('SR', 'country', 'Suriname'), 
          ('SJ', 'country', 'Svalbard and Jan Mayen'), ('SZ', 'country', 'Swaziland'), ('SE', 'country', 'Sweden'), 
          ('CH', 'country', 'Switzerland'), ('SY', 'country', 'Syrian Arab Republic'), ('TW', 'country', 'Taiwan, Province of China'), 
          ('TJ', 'country', 'Tajikistan'), ('TZ', 'country', 'Tanzania, United Republic of'), ('TH', 'country', 'Thailand'), 
          ('TL', 'country', 'Timor-Leste'), ('TG', 'country', 'Togo'), ('TK', 'country', 'Tokelau'), 
          ('TO', 'country', 'Tonga'), ('TT', 'country', 'Trinidad and Tobago'), ('TN', 'country', 'Tunisia'), 
          ('TR', 'country', 'Turkey'), ('TM', 'country', 'Turkmenistan'), ('TC', 'country', 'Turks and Caicos Islands'), 
          ('TV', 'country', 'Tuvalu'), ('UG', 'country', 'Uganda'), ('UA', 'country', 'Ukraine'), 
          ('AE', 'country', 'United Arab Emirates'), ('GB', 'country', 'United Kingdom'), ('US', 'country', 'United States'), 
          ('UM', 'country', 'United States Minor Outlying Islands'), ('UY', 'country', 'Uruguay'), ('UZ', 'country', 'Uzbekistan'), 
          ('VU', 'country', 'Vanuatu'), ('VE', 'country', 'Venezuela'), ('VN', 'country', 'Viet Nam'), 
          ('VG', 'country', 'Virgin Islands, British'), ('VI', 'country', 'Virgin Islands, U.S.'), ('WF', 'country', 'Wallis and Futuna'), 
          ('EH', 'country', 'Western Sahara'), ('YE', 'country', 'Yemen'), ('ZM', 'country', 'Zambia'), 
          ('ZW', 'country', 'Zimbabwe'),
          ('af_NA', 'language', 'Afrikaans (Namibia)'), ('af_ZA', 'language', 'Afrikaans (South Africa)'), ('af', 'language', 'Afrikaans'),
          ('ak_GH', 'language', 'Akan (Ghana)'), ('ak', 'language', 'Akan'), ('sq_AL', 'language', 'Albanian (Albania)'), ('sq', 'language', 'Albanian'),
          ('am_ET', 'language', 'Amharic (Ethiopia)'), ('am', 'language', 'Amharic'), ('ar_DZ', 'language', 'Arabic (Algeria)'), ('ar_BH', 'language', 'Arabic (Bahrain)'),
          ('ar_EG', 'language', 'Arabic (Egypt)'), ('ar_IQ', 'language', 'Arabic (Iraq)'), ('ar_JO', 'language', 'Arabic (Jordan)'), ('ar_KW', 'language', 'Arabic (Kuwait)'),
          ('ar_LB', 'language', 'Arabic (Lebanon)'), ('ar_LY', 'language', 'Arabic (Libya)'), ('ar_MA', 'language', 'Arabic (Morocco)'), ('ar_OM', 'language', 'Arabic (Oman)'),
          ('ar_QA', 'language', 'Arabic (Qatar)'), ('ar_SA', 'language', 'Arabic (Saudi Arabia)'), ('ar_SD', 'language', 'Arabic (Sudan)'), ('ar_SY', 'language', 'Arabic (Syria)'),
          ('ar_TN', 'language', 'Arabic (Tunisia)'), ('ar_AE', 'language', 'Arabic (United Arab Emirates)'), ('ar_YE', 'language', 'Arabic (Yemen)'), ('ar', 'language', 'Arabic'),
          ('hy_AM', 'language', 'Armenian (Armenia)'), ('hy', 'language', 'Armenian'), ('as_IN', 'language', 'Assamese (India)'), ('as', 'language', 'Assamese'),
          ('asa_TZ', 'language', 'Asu (Tanzania)'), ('asa', 'language', 'Asu'), ('az_Cyrl', 'language', 'Azerbaijani (Cyrillic, Azerbaijan)'), ('az_Latn', 'language', 'Azerbaijani (Latin)'),
          ('az', 'language', 'Azerbaijani'), ('bm_ML', 'language', 'Bambara (Mali)'), ('bm', 'language', 'Bambara'), ('eu_ES', 'language', 'Basque (Spain)'), ('eu', 'language', 'Basque'),
          ('be_BY', 'language', 'Belarusian (Belarus)'), ('be', 'language', 'Belarusian'), ('bem_ZM', 'language', 'Bemba (Zambia)'), ('bem', 'language', 'Bemba'),
          ('bez_TZ', 'language', 'Bena (Tanzania)'), ('bez', 'language', 'Bena'), ('bn_BD', 'language', 'Bengali (Bangladesh)'), ('bn_IN', 'language', 'Bengali (India)'), ('bn', 'language', 'Bengali'),
          ('bs_BA', 'language', 'Bosnian (Bosnia and Herzegovina)'), ('bs', 'language', 'Bosnian'), ('bg_BG', 'language', 'Bulgarian (Bulgaria)'), ('bg', 'language', 'Bulgarian'),
          ('my_MM', 'language', 'Burmese (Myanmar [Burma])'), ('my', 'language', 'Burmese'), ('yue_Hant_HK', 'language', 'Cantonese (Traditional, Hong Kong SAR China)'),
          ('ca_ES', 'language', 'Catalan (Spain)'), ('ca', 'language', 'Catalan'), ('tzm_Latn', 'language', 'Central Morocco Tamazight (Latin)'), ('tzm', 'language', 'Central Morocco Tamazight'),
          ('chr_US', 'language', 'Cherokee (United States)'), ('chr', 'language', 'Cherokee'), ('cgg_UG', 'language', 'Chiga (Uganda)'), ('cgg', 'language', 'Chiga'),
          ('zh_Hans', 'language', 'Chinese (Simplified Han)'), ('zh_Hans_CN', 'language', 'Chinese (Simplified Han, China)'), ('zh_Hant', 'language', 'Chinese (Traditional Han)'), ('zh', 'language', 'Chinese'),
          ('kw_GB', 'language', 'Cornish (United Kingdom)'), ('kw', 'language', 'Cornish'), ('hr_HR', 'language', 'Croatian (Croatia)'), ('hr', 'language', 'Croatian'),
          ('cs_CZ', 'language', 'Czech (Czech Republic)'), ('cs', 'language', 'Czech'), ('da_DK', 'language', 'Danish (Denmark)'), ('da', 'language', 'Danish'),
          ('nl_BE', 'language', 'Dutch (Belgium)'), ('nl_NL', 'language', 'Dutch (Netherlands)'), ('nl', 'language', 'Dutch'), ('ebu_KE', 'language', 'Embu (Kenya)'), ('ebu', 'language', 'Embu'),
          ('en_AU', 'language', 'English (Australia)'), ('en_CA', 'language', 'English (Canada)'), ('en_IN', 'language', 'English (India)'), ('en_IE', 'language', 'English (Ireland)'),
          ('en_NZ', 'language', 'English (New Zealand)'), ('en_ZA', 'language', 'English (South Africa)'), ('en_GB', 'language', 'English (United Kingdom)'), ('en_US', 'language', 'English (United States)'),
          ('en', 'language', 'English'), ('eo', 'language', 'Esperanto'), ('et_EE', 'language', 'Estonian (Estonia)'), ('et', 'language', 'Estonian'),
          ('ee_GH', 'language', 'Ewe (Ghana)'), ('ee', 'language', 'Ewe'), ('fo_FO', 'language', 'Faroese (Faroe Islands)'), ('fo', 'language', 'Faroese'),
          ('fil_PH', 'language', 'Filipino (Philippines)'), ('fil', 'language', 'Filipino'), ('fi_FI', 'language', 'Finnish (Finland)'), ('fi', 'language', 'Finnish'),
          ('fr_BE', 'language', 'French (Belgium)'), ('fr_CA', 'language', 'French (Canada)'), ('fr_FR', 'language', 'French (France)'), ('fr_CH', 'language', 'French (Switzerland)'), ('fr', 'language', 'French'),
          ('ff_SN', 'language', 'Fulah (Senegal)'), ('ff', 'language', 'Fulah'), ('gl_ES', 'language', 'Galician (Spain)'), ('gl', 'language', 'Galician'),
          ('lg_UG', 'language', 'Ganda (Uganda)'), ('lg', 'language', 'Ganda'), ('ka_GE', 'language', 'Georgian (Georgia)'), ('ka', 'language', 'Georgian'),
          ('de_AT', 'language', 'German (Austria)'), ('de_DE', 'language', 'German (Germany)'), ('de_CH', 'language', 'German (Switzerland)'), ('de', 'language', 'German'),
          ('el_GR', 'language', 'Greek (Greece)'), ('el', 'language', 'Greek'), ('gu_IN', 'language', 'Gujarati (India)'), ('gu', 'language', 'Gujarati'),
          ('guz_KE', 'language', 'Gusii (Kenya)'), ('guz', 'language', 'Gusii'), ('ha_Latn', 'language', 'Hausa (Latin)'), ('ha', 'language', 'Hausa'),
          ('haw_US', 'language', 'Hawaiian (United States)'), ('haw', 'language', 'Hawaiian'), ('he_IL', 'language', 'Hebrew (Israel)'), ('he', 'language', 'Hebrew'),
          ('hi_IN', 'language', 'Hindi (India)'), ('hi', 'language', 'Hindi'), ('hu_HU', 'language', 'Hungarian (Hungary)'), ('hu', 'language', 'Hungarian'),
          ('is_IS', 'language', 'Icelandic (Iceland)'), ('is', 'language', 'Icelandic'), ('ig_NG', 'language', 'Igbo (Nigeria)'), ('ig', 'language', 'Igbo'),
          ('id_ID', 'language', 'Indonesian (Indonesia)'), ('id', 'language', 'Indonesian'), ('ga_IE', 'language', 'Irish (Ireland)'), ('ga', 'language', 'Irish'),
          ('it_IT', 'language', 'Italian (Italy)'), ('it_CH', 'language', 'Italian (Switzerland)'), ('it', 'language', 'Italian'), ('ja_JP', 'language', 'Japanese (Japan)'), ('ja', 'language', 'Japanese'),
          ('kea_CV', 'language', 'Kabuverdianu (Cape Verde)'), ('kea', 'language', 'Kabuverdianu'), ('kab_DZ', 'language', 'Kabyle (Algeria)'), ('kab', 'language', 'Kabyle'),
          ('kl_GL', 'language', 'Kalaallisut (Greenland)'), ('kl', 'language', 'Kalaallisut'), ('kln_KE', 'language', 'Kalenjin (Kenya)'), ('kln', 'language', 'Kalenjin'),
          ('kam_KE', 'language', 'Kamba (Kenya)'), ('kam', 'language', 'Kamba'), ('kn_IN', 'language', 'Kannada (India)'), ('kn', 'language', 'Kannada'),
          ('kk_Cyrl', 'language', 'Kazakh (Cyrillic)'), ('kk', 'language', 'Kazakh'), ('km_KH', 'language', 'Khmer (Cambodia)'), ('km', 'language', 'Khmer'),
          ('ki_KE', 'language', 'Kikuyu (Kenya)'), ('ki', 'language', 'Kikuyu'), ('rw_RW', 'language', 'Kinyarwanda (Rwanda)'), ('rw', 'language', 'Kinyarwanda'),
          ('kok_IN', 'language', 'Konkani (India)'), ('kok', 'language', 'Konkani'), ('ko_KR', 'language', 'Korean (South Korea)'), ('ko', 'language', 'Korean'),
          ('khq_ML', 'language', 'Koyra Chiini (Mali)'), ('khq', 'language', 'Koyra Chiini'), ('ses_ML', 'language', 'Koyraboro Senni (Mali)'), ('ses', 'language', 'Koyraboro Senni'),
          ('lag_TZ', 'language', 'Langi (Tanzania)'), ('lag', 'language', 'Langi'), ('lv_LV', 'language', 'Latvian (Latvia)'), ('lv', 'language', 'Latvian'),
          ('lt_LT', 'language', 'Lithuanian (Lithuania)'), ('lt', 'language', 'Lithuanian'), ('luo_KE', 'language', 'Luo (Kenya)'), ('luo', 'language', 'Luo'),
          ('luy_KE', 'language', 'Luyia (Kenya)'), ('luy', 'language', 'Luyia'), ('mk_MK', 'language', 'Macedonian (Macedonia)'), ('mk', 'language', 'Macedonian'),
          ('jmc_TZ', 'language', 'Machame (Tanzania)'), ('jmc', 'language', 'Machame'), ('kde_TZ', 'language', 'Makonde (Tanzania)'), ('kde', 'language', 'Makonde'),
          ('mg_MG', 'language', 'Malagasy (Madagascar)'), ('mg', 'language', 'Malagasy'), ('ms_BN', 'language', 'Malay (Brunei)'), ('ms_MY', 'language', 'Malay (Malaysia)'), ('ms', 'language', 'Malay'),
          ('ml_IN', 'language', 'Malayalam (India)'), ('ml', 'language', 'Malayalam'), ('mt_MT', 'language', 'Maltese (Malta)'), ('mt', 'language', 'Maltese'),
          ('gv_GB', 'language', 'Manx (United Kingdom)'), ('gv', 'language', 'Manx'), ('mr_IN', 'language', 'Marathi (India)'), ('mr', 'language', 'Marathi'),
          ('mas_KE', 'language', 'Masai (Kenya)'), ('mas', 'language', 'Masai'), ('mer_KE', 'language', 'Meru (Kenya)'), ('mer', 'language', 'Meru'),
          ('mfe_MU', 'language', 'Morisyen (Mauritius)'), ('mfe', 'language', 'Morisyen'), ('naq_NA', 'language', 'Nama (Namibia)'), ('naq', 'language', 'Nama'),
          ('ne_IN', 'language', 'Nepali (India)'), ('ne_NP', 'language', 'Nepali (Nepal)'), ('ne', 'language', 'Nepali'), ('nd_ZW', 'language', 'North Ndebele (Zimbabwe)'), ('nd', 'language', 'North Ndebele'),
          ('nb_NO', 'language', 'Norwegian Bokmål (Norway)'), ('nb', 'language', 'Norwegian Bokmål'), ('nn_NO', 'language', 'Norwegian Nynorsk (Norway)'), ('nn', 'language', 'Norwegian Nynorsk'),
          ('nyn_UG', 'language', 'Nyankole (Uganda)'), ('nyn', 'language', 'Nyankole'), ('or_IN', 'language', 'Oriya (India)'), ('or', 'language', 'Oriya'),
          ('om_ET', 'language', 'Oromo (Ethiopia)'), ('om', 'language', 'Oromo'), ('ps_AF', 'language', 'Pashto (Afghanistan)'), ('ps', 'language', 'Pashto'),
          ('fa_AF', 'language', 'Persian (Afghanistan)'), ('fa_IR', 'language', 'Persian (Iran)'), ('fa', 'language', 'Persian'), ('pl_PL', 'language', 'Polish (Poland)'), ('pl', 'language', 'Polish'),
          ('pt_BR', 'language', 'Portuguese (Brazil)'), ('pt_PT', 'language', 'Portuguese (Portugal)'), ('pt', 'language', 'Portuguese'), ('pa_Arab', 'language', 'Punjabi (Arabic)'),
          ('pa_Guru', 'language', 'Punjabi (Gurmukhi)'), ('pa', 'language', 'Punjabi'), ('ro_MD', 'language', 'Romanian (Moldova)'), ('ro_RO', 'language', 'Romanian (Romania)'), ('ro', 'language', 'Romanian'),
          ('rm_CH', 'language', 'Romansh (Switzerland)'), ('rm', 'language', 'Romansh'), ('rof_TZ', 'language', 'Rombo (Tanzania)'), ('rof', 'language', 'Rombo'),
          ('ru_RU', 'language', 'Russian (Russia)'), ('ru_UA', 'language', 'Russian (Ukraine)'), ('ru', 'language', 'Russian'), ('rwk_TZ', 'language', 'Rwa (Tanzania)'), ('rwk', 'language', 'Rwa'),
          ('saq_KE', 'language', 'Samburu (Kenya)'), ('saq', 'language', 'Samburu'), ('sg_CF', 'language', 'Sango (Central African Republic)'), ('sg', 'language', 'Sango'),
          ('seh_MZ', 'language', 'Sena (Mozambique)'), ('seh', 'language', 'Sena'), ('sr_Cyrl', 'language', 'Serbian (Cyrillic)'), ('sr_Latn', 'language', 'Serbian (Latin)'), ('sr', 'language', 'Serbian'),
          ('sn_ZW', 'language', 'Shona (Zimbabwe)'), ('sn', 'language', 'Shona'), ('ii_CN', 'language', 'Sichuan Yi (China)'), ('ii', 'language', 'Sichuan Yi'),
          ('si_LK', 'language', 'Sinhala (Sri Lanka)'), ('si', 'language', 'Sinhala'), ('sk_SK', 'language', 'Slovak (Slovakia)'), ('sk', 'language', 'Slovak'),
          ('sl_SI', 'language', 'Slovenian (Slovenia)'), ('sl', 'language', 'Slovenian'), ('xog_UG', 'language', 'Soga (Uganda)'), ('xog', 'language', 'Soga'),
          ('so_SO', 'language', 'Somali (Somalia)'), ('so', 'language', 'Somali'), ('es_AR', 'language', 'Spanish (Argentina)'), ('es_MX', 'language', 'Spanish (Mexico)'),
          ('es_ES', 'language', 'Spanish (Spain)'), ('es_US', 'language', 'Spanish (United States)'), ('es', 'language', 'Spanish'), ('sw_KE', 'language', 'Swahili (Kenya)'),
          ('sw_TZ', 'language', 'Swahili (Tanzania)'), ('sw', 'language', 'Swahili'), ('sv_SE', 'language', 'Swedish (Sweden)'), ('sv', 'language', 'Swedish'),
          ('gsw_CH', 'language', 'Swiss German (Switzerland)'), ('gsw', 'language', 'Swiss German'), ('shi_Latn', 'language', 'Tachelhit (Latin)'), ('shi', 'language', 'Tachelhit'),
          ('dav_KE', 'language', 'Taita (Kenya)'), ('dav', 'language', 'Taita'), ('ta_IN', 'language', 'Tamil (India)'), ('ta', 'language', 'Tamil'),
          ('te_IN', 'language', 'Telugu (India)'), ('te', 'language', 'Telugu'), ('teo_UG', 'language', 'Teso (Uganda)'), ('teo', 'language', 'Teso'),
          ('th_TH', 'language', 'Thai (Thailand)'), ('th', 'language', 'Thai'), ('bo_CN', 'language', 'Tibetan (China)'), ('bo', 'language', 'Tibetan'),
          ('ti_ER', 'language', 'Tigrinya (Eritrea)'), ('ti', 'language', 'Tigrinya'), ('to_TO', 'language', 'Tonga (Tonga)'), ('to', 'language', 'Tonga'),
          ('tr_TR', 'language', 'Turkish (Turkey)'), ('tr', 'language', 'Turkish'), ('uk_UA', 'language', 'Ukrainian (Ukraine)'), ('uk', 'language', 'Ukrainian'),
          ('ur_IN', 'language', 'Urdu (India)'), ('ur_PK', 'language', 'Urdu (Pakistan)'), ('ur', 'language', 'Urdu'), ('uz_Arab', 'language', 'Uzbek (Arabic)'),
          ('uz_Cyrl', 'language', 'Uzbek (Cyrillic)'), ('uz_Latn', 'language', 'Uzbek (Latin)'), ('uz', 'language', 'Uzbek'), ('vi_VN', 'language', 'Vietnamese (Vietnam)'), ('vi', 'language', 'Vietnamese'),
          ('vun_TZ', 'language', 'Vunjo (Tanzania)'), ('vun', 'language', 'Vunjo'), ('cy_GB', 'language', 'Welsh (United Kingdom)'), ('cy', 'language', 'Welsh'),
          ('yo_NG', 'language', 'Yoruba (Nigeria)'), ('yo', 'language', 'Yoruba'), ('zu_ZA', 'language', 'Zulu (South Africa)'), ('zu', 'language', 'Zulu')
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

  // Metadata (Languages, Countries, Categories, etc.)
  app.get("/api/metadata", async (req, res) => {
    const { type } = req.query;
    try {
      let query = 'SELECT * FROM metadata';
      let params: any[] = [];
      if (type) {
        query += ' WHERE type = $1';
        params.push(type);
      }
      query += ' ORDER BY name ASC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/metadata", async (req, res) => {
    const { type, name } = req.body;
    const id = Date.now().toString();
    try {
      const result = await pool.query('INSERT INTO metadata (id, type, name) VALUES ($1, $2, $3) RETURNING *', [id, type, name]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/metadata/:id", async (req, res) => {
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

  app.delete("/api/metadata/:id", async (req, res) => {
    try {
      await pool.query('DELETE FROM metadata WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Upload Proxy Routes
  app.post("/api/upload/litterbox", upload.single('file'), async (req, res) => {
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

  app.post("/api/upload/catbox", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const userHash = process.env.CATBOX_USER_HASH || 'f7a6dc6f6e1e00e15d9136342';
    const albumShort = 'be947l';

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
