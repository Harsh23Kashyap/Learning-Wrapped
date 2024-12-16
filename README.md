# 🚀 Learning Wrapped: Transforming the Way You Learn! 📚✨

Welcome to **Learning Wrapped**, a dynamic web app designed to make your learning experience engaging, efficient, and fun! Say goodbye to boring PDFs and hello to a smarter way of studying!

---

## 🌟 Features
With **Learning Wrapped**, you can:
1. **🖼️ Generate Visual Learning Content:** Upload your PDFs or text, and the app will create engaging images along with concise descriptions (under 100 words!) to simplify complex topics.
2. **📚 Create Quizzes:** Test your knowledge with automatically generated quizzes to reinforce learning.
3. **🃏 Flashcards:** Quickly review key concepts on the go with GRE-styled flashcards.
4. **🎥 Learn as Shorts:** Turn content into bite-sized learning snippets, combining visuals and summaries, perfect for on-the-go productivity!

Think of it as the learning equivalent of scrolling through TikTok or Instagram reels—but much more productive and rewarding! 🌟💡

---

## 🎬 Screenshots of the Flow

![Screenshot 1](https://github.com/Harsh23Kashyap/Learning-Wrapped/blob/main/Screenshots/1.png)  
![Screenshot 2](https://github.com/Harsh23Kashyap/Learning-Wrapped/blob/main/Screenshots/2.png)  
![Screenshot 3](https://github.com/Harsh23Kashyap/Learning-Wrapped/blob/main/Screenshots/3.png)  
![Screenshot 4](https://github.com/Harsh23Kashyap/Learning-Wrapped/blob/main/Screenshots/4.png)  
![Screenshot 5](https://github.com/Harsh23Kashyap/Learning-Wrapped/blob/main/Screenshots/5.png)  
![Screenshot 6](https://github.com/Harsh23Kashyap/Learning-Wrapped/blob/main/Screenshots/6.png)  
![Screenshot 7](https://github.com/Harsh23Kashyap/Learning-Wrapped/blob/main/Screenshots/7.png)  
![Screenshot 8](https://github.com/Harsh23Kashyap/Learning-Wrapped/blob/main/Screenshots/8.png)  

---

## 🚀 How to Get Started

### Clone the Repository
```bash
git clone https://github.com/Harsh23Kashyap/Learning-Wrapped.git
cd Learning-Wrapped
Install Dependencies
Install the required Python dependencies:

pip install -r requirements.txt
Install the required JavaScript dependencies:

npm install
Set Up Your Environment
To use the app, you'll need a Gemini API key for generating content.
Add your Gemini API key in the env.js file:

javascript
Copy code
const ENV = {
    BASE_URL: 'http://127.0.0.1:8000',
    QUIZ_API: '/generate_quiz',
    FLASHCARD_API: '/generate_flashcards',
    SHORTS_API: '/learn_shorts',
    GEMINI_API_KEY: 'your-gemini-api-key-here'
};
Run the Backend
Start the Flask server:


python -m uvicorn main:app --reload
Run the Frontend
Serve the app locally:

npm start
Access the App
Open your browser and go to:

http://127.0.0.1:8000
