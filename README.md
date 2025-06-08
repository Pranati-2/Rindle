# 📚 Rindle — A Clean Reading Interface for Academic PDFs

Rindle is a prototype web application that reformats academic PDFs into a clean, readable layout. Built to improve the research reading experience on screens, it extracts structured content from research papers and presents it through a streamlined frontend.

This project was created to address a common frustration: academic PDFs are hard to read on mobile or even desktop due to poor formatting. Rindle simplifies this by parsing key sections and re-rendering them in a user-friendly format.

---

## ✨ What It Does

- Converts academic PDF papers into readable text using `pdfplumber`
- Identifies and extracts common sections (like Abstract, Introduction, Conclusion)
- Displays extracted sections on a simple web interface built with React
- Sends PDF files from the frontend to the Flask backend and receives structured text data

---

## 🛠 Prospective Tech Stack

| Component | Technology     |
|----------|----------------|
| Frontend | React, Axios   |
| Backend  | Python, Flask  |
| Parsing  | pdfplumber     |

---

## 🚀 How to Run Locally

```bash
npm install
npm start
