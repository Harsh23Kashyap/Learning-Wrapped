import os
from concurrent.futures import ThreadPoolExecutor

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import google.generativeai as genai
import time
from PIL import Image
import requests
from io import BytesIO

# Configure Gemini API
genai.configure(api_key="YOU_API")
model = genai.GenerativeModel("gemini-1.5-flash")

# Flask Application
app = Flask(__name__)
CORS(app)

def generate_short_and_image(text_chunk, index, base_dir):
    """
    Generate a short summary (200 words) and an image for the given text chunk.
    Save the results in the provided base directory.
    """
    print("Generating shorts and images")
    try:
        # Step 1: Generate a summary using Gemini API
        summary_prompt = (
            f"Summarize the following text in around 100 words:\n\n{text_chunk}\n\n"
            f"Keep the summary concise and engaging."
        )
        response_summary = model.generate_content(summary_prompt)
        summary = response_summary.text.strip()
        print(f"Generated Summary: {summary}")

        # Step 2: Generate main topic using Gemini API
        topic_prompt = (
            f"From the following text, extract the main topic or idea in a single concise sentence:\n\n{text_chunk}"
        )
        response_topic = model.generate_content(topic_prompt)
        main_topic = response_topic.text.strip()
        print(f"Generated Main Topic: {main_topic}")

        # Step 3: Generate image using Pollinations API with the main topic
        image_prompt = main_topic
        image_url = f"https://image.pollinations.ai/prompt/{image_prompt}"
        print(f"Generating image for: {main_topic}")
        
        response = requests.get(image_url, stream=True)
        if response.status_code == 200:
            # Save the summary
            text_file_path = os.path.join(base_dir, f"chunk_{index + 1}_summary.txt")
            with open(text_file_path, "w", encoding="utf-8") as file:
                file.write(summary)

            # Save the image
            image_path = os.path.join(base_dir, f"chunk_{index + 1}_image.png")
            image = Image.open(BytesIO(response.content))
            image.save(image_path)

            print(f"Generated summary and image saved for chunk {index + 1}.")
            return {"summary": summary, "main_topic": main_topic, "image_path": image_path}
        else:
            print(f"Failed to generate image for chunk {index + 1}. HTTP Status: {response.status_code}")
            return {"summary": summary, "main_topic": main_topic, "image_path": None}

    except Exception as e:
        print(f"Error generating summary and image for chunk {index + 1}: {e}")
        return {"summary": "Error generating content.", "main_topic": None, "image_path": None}



@app.route('/learn_shorts', methods=['POST'])
def learn_shorts():
    # Check if a file is uploaded
    if 'file' in request.files:
        file = request.files['file']
        file_path = os.path.join('/tmp', file.filename)
        file.save(file_path)

        if file.filename.lower().endswith('.pdf'):
            content = read_pdf(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

        os.remove(file_path)

    elif 'text' in request.json:
        content = request.json['text']
    else:
        return jsonify({"error": "No content provided"}), 400

    # Generate a single timestamp for the request
    timestamp = str(int(time.time()))
    base_dir = os.path.join(os.getcwd(), "results", timestamp)

    # Create the base directory
    os.makedirs(base_dir, exist_ok=True)
    print(f"Base directory created: {base_dir}")

    # Split content into smaller chunks
    text_chunks = split_text_into_chunks(content, chunk_size=500)

    print(text_chunks)
    print("DONE")
    # Create a thread pool for concurrent processing
    all_results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        # Submit tasks to the thread pool
        futures = [
            executor.submit(generate_short_and_image, chunk, index, base_dir)
            for index, chunk in enumerate(text_chunks)
        ]

        # Collect results as tasks complete
        for future in futures:
            try:
                result = future.result()
                all_results.append(result)
                # Limit the number of chunks processed
                if len(all_results) >= 10:
                    break
            except Exception as e:
                print(f"Error processing a chunk: {e}")

    return jsonify({
        "content_summary": content[:500] + "...",
        "results": all_results,
        "output_directory": base_dir
    })


def read_pdf(file_path):
    """Read text content from a PDF file."""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
    return text

def split_text_into_chunks(text, chunk_size=1000):
    """Split text into chunks of a specified size."""
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

def generate_questions_from_text(text_chunk, max_questions=10):
    """
    Generate questions from a text chunk using the Gemini API.
    Stops once the maximum number of questions is reached.
    """
    try:

        prompt = (
            f"From the following text, generate exactly 3 quiz questions. "
            f"Each question should be structured in the following format:\n\n"
            f"Question: <Your question here>\n"
            f"Options:\n"
            f"- <Option 1>\n"
            f"- <Option 2>\n"
            f"- <Option 3>\n"
            f"- <Option 4>\n"
            f"Answer: <Correct answer here>\n\n"
            f"Ensure the options are listed without any prefixes like A), B), etc. "
            f"Provide the output strictly in the specified format:\n\n"
            f"{text_chunk}"
        )


        response = model.generate_content(prompt)
        generated_content = response.text

        questions = []
        lines = generated_content.split("\n")
        current_question = {"question": "", "options": [], "correct_answer": ""}

        for line in lines:
            line = line.strip()
            if line.startswith("Question:"):
                # Save the previous question if it exists
                if current_question["question"] and current_question["options"]:
                    questions.append(current_question)

                # Start a new question
                current_question = {"question": line.split("Question:", 1)[1].strip(), "options": [], "correct_answer": ""}
            elif line.startswith("Options:"):
                # Continue parsing options
                continue
            elif line.startswith("-"):
                # Add option to the current question
                current_question["options"].append(line[1:].strip())
            elif line.startswith("Answer:"):
                # Set the correct answer
                current_question["correct_answer"] = line.split("Answer:", 1)[1].strip()

        # Add the last question if not already added
        if current_question["question"] and current_question["options"]:
            questions.append(current_question)

        return questions
    except Exception as e:
        print(f"Error generating questions: {e}")
        return []


@app.route('/gre_flashcard', methods=['POST'])
def generate_flashcards():
    isfile = True
    # Check if file is uploaded
    if 'file' in request.files:
        file = request.files['file']
        # Save temporarily
        file_path = os.path.join('/tmp', file.filename)
        file.save(file_path)

        # Determine file type and extract text
        if file.filename.lower().endswith('.pdf'):
            content = read_pdf(file_path)
        else:
            # For other file types, read as text
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        
        # Remove temporary file
        os.remove(file_path)
    
    # Check for text input
    elif 'text' in request.json:
        isfile = False
        content = request.json['text']
    
    else:
        return jsonify({"error": "No content provided"}), 400

    # Split content into chunks
    text_chunks = split_text_into_chunks(content)

    # Generate flashcards from each chunk
    flashcards = []
    for chunk in text_chunks:
        flashcards.extend(generate_flashcards_from_text(chunk,isfile=isfile))
        if len(flashcards) >= 10:  # Limit to 10 flashcards
            break
    # print()
    # print(jsonify({
    #     "content_summary": content[:500] + "...",  
    #     "flashcards": flashcards
    # }))
    return jsonify({
        "content_summary": content[:500] + "...",  # First 500 chars
        "flashcards": flashcards
    })


def generate_flashcards_from_text(text_chunk, isfile):
    
    """Generate flashcards from a text chunk using the Gemini API."""
    try:
        # Step 1: Create the prompt based on input type
        if isfile:
            # Refined prompt for extracting GRE-level tough words from text
            prompt = (
                f"Identify 10 challenging GRE-level words from the following text: "
                f"{text_chunk}. For each word, provide:\n"
                f"1. The word itself.\n"
                f"2. A correct meaning.\n"
                f"3. An incorrect meaning.\n"
                f"Format each word as:\n"
                f"Word: <word>\n"
                f"Meaning 1: <correct meaning>\n"
                f"Meaning 2: <incorrect but a bit similar meaning to confuse>\n"
                f"Correct Meaning: <correct meaning>"
            )
        else:
            # Refined prompt for generating flashcards directly from a list of words
            words = text_chunk.split()[:10]  # Limit to the first 10 words
            prompt = (
                f"Using the following list of words: {', '.join(words)}, create flashcards. "
                f"For each word, provide:\n"
                f"1. The word itself.\n"
                f"2. A correct meaning.\n"
                f"3. An incorrect meaning.\n"
                f"Format each word as:\n"
                f"Word: <word>\n"
                f"Meaning 1: <correct meaning>\n"
                f"Meaning 2: <incorrect but a bit similar meaning to confuse>\n"
                f"Correct Meaning: <correct meaning>"
            )
        
        # Step 2: Generate content using the Gemini API
        response = model.generate_content(prompt)
        generated_content = response.text
        print(generated_content)  # Debug the API response

        # Step 3: Parse the response into flashcards
        flashcards = []
        lines = generated_content.split("\n")
        current_flashcard = {"text": "", "option1": "", "option2": "", "correct_option": ""}

        for line in lines:
            line = line.strip()
            if line.startswith("Word:") or line.startswith("Term:"):
                if current_flashcard["text"]:
                    flashcards.append(current_flashcard)
                current_flashcard = {"text": line.split(":", 1)[1].strip(), "option1": "", "option2": "", "correct_option": ""}
            elif line.startswith("Meaning 1:") or line.startswith("Option 1:"):
                current_flashcard["option1"] = line.split(":", 1)[1].strip()
            elif line.startswith("Meaning 2:") or line.startswith("Option 2:"):
                current_flashcard["option2"] = line.split(":", 1)[1].strip()
            elif line.startswith("Correct Meaning:") or line.startswith("Correct Option:"):
                current_flashcard["correct_option"] = line.split(":", 1)[1].strip()

        # Add the last flashcard if it exists
        if current_flashcard["text"]:
            flashcards.append(current_flashcard)

        print(flashcards[0])
        return flashcards

    except Exception as e:
        print(f"Error generating flashcards: {e}")
        return []

@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({"message": "Hello, World!"})

@app.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    # time.sleep(2)
    # Check if file is uploaded
    if 'file' in request.files:
        file = request.files['file']
        # Save temporarily
        file_path = os.path.join('/tmp', file.filename)
        file.save(file_path)

        # Determine file type and extract text
        if file.filename.lower().endswith('.pdf'):
            content = read_pdf(file_path)
        else:
            # For other file types, read as text
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        
        # Remove temporary file
        os.remove(file_path)
    
    # Check for text input
    elif 'text' in request.json:
        content = request.json['text']
    
    else:
        return jsonify({"error": "No content provided"}), 400

    # Split content into chunks
    text_chunks = split_text_into_chunks(content)

    # Generate questions from each chunk
    all_questions = []
    total_questions_generated = 0
    for chunk in text_chunks:
        questions = generate_questions_from_text(chunk)
        all_questions.extend(questions)
        total_questions_generated += 3
        if total_questions_generated > 10:
            break
    return jsonify({
        "content_summary": content[:500] + "...",  # First 500 chars
        "questions": all_questions
    })

if __name__ == '__main__':
    app.run(debug=True, port=8000)
