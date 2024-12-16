// Access the environment variables
const BASE_URL = window.ENV.BASE_URL;
const QUIZ_API = window.ENV.QUIZ_API;
const SHORTS_API = window.ENV.SHORTS_API;
const FLASHCARD_API = window.ENV.FLASHCARD_API;

// Tab elements and sections
const textTab = document.getElementById('text-tab');
const fileTab = document.getElementById('file-tab');
const textUploadSection = document.getElementById('text-upload-section');
const fileUploadSection = document.getElementById('file-upload-section');
const submitBtn = document.getElementById('submit-btn');
const textInput = document.getElementById('text-input');
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const container = document.querySelector('.container');

// Disable the submit button initially
submitBtn.disabled = true;
submitBtn.style.opacity = '0.6';
submitBtn.style.cursor = 'not-allowed';

// Function to enable or disable the submit button
function toggleSubmitButton() {
    if (textTab.classList.contains('btn-active') && textInput.value.trim()) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    } else if (fileTab.classList.contains('btn-active') && fileInput.files.length > 0) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
    }
}

// Event listeners for tab switching
textTab.addEventListener('click', () => {
    textTab.classList.add('btn-active');
    fileTab.classList.remove('btn-active');
    textUploadSection.style.display = 'block';
    fileUploadSection.style.display = 'none';
    toggleSubmitButton();
});

fileTab.addEventListener('click', () => {
    fileTab.classList.add('btn-active');
    textTab.classList.remove('btn-active');
    fileUploadSection.style.display = 'block';
    textUploadSection.style.display = 'none';
    toggleSubmitButton();
});

// Event listener for text input
textInput.addEventListener('input', toggleSubmitButton);

// Event listener for file input
fileInput.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
        fileName.textContent = event.target.files[0].name;
    } else {
        fileName.textContent = 'No file chosen';
    }
    toggleSubmitButton();
});

// Function to handle learning option
async function handleLearningOption(option) {
    let apiUrl;
    switch (option) {
        case 'quiz':
            apiUrl = `${BASE_URL}${QUIZ_API}`;
            break;
        case 'flashcard':
            apiUrl = `${BASE_URL}${FLASHCARD_API}`;
            break;
        case 'shorts':
            apiUrl = `${BASE_URL}${SHORTS_API}`;
            break;
        default:
            console.error("Invalid option provided");
            return;
    }

    let requestData;
    if (textTab.classList.contains('btn-active')) {
        if (!textInput.value.trim()) {
            alert('Please enter some text.');
            return;
        }
        requestData = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textInput.value.trim() }),
        };
    } else if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        requestData = { method: 'POST', body: formData };
    } else {
        alert('Please choose a file.');
        return;
    }

    // Show loading screen
    container.innerHTML = `
        <div class="loading-screen">
            <p>Loading your insights, please wait...</p>
            <div class="loading-spinner"></div>
        </div>
    `;

    // Fetch data from backend
    try {
        const response = await fetch(apiUrl, requestData);
        const data = await response.json();

        if (option === 'quiz') {
            if (data.questions && data.questions.length > 0) {
                displayQuestion(data.questions, 0);
            } else {
                container.innerHTML = `<p>No questions generated!</p>`;
            }
        } else if (option === 'flashcard') {
            if (data.flashcards && data.flashcards.length > 0) {
                displayFlashcard(data.flashcards);
            } else {
                container.innerHTML = `<p>No flashcards available!</p>`;
            }
        } else if (option === 'shorts') {
            if (data.results && data.results.length > 0) {
                displayShorts(data.results);
            } else {
                container.innerHTML = `<p>No shorts available!</p>`;
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        container.innerHTML = `
    <div style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        text-align: center; 
        padding: 30px; 
        background-color: #1e1e1e; 
        border-radius: 12px; 
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); 
        color: #fff; 
        max-width: 600px; 
        margin: auto;">
        <h2 style="font-size: 24px; font-weight: bold; color: #FF6F61; margin-bottom: 20px;">Oops! Something went wrong.</h2>
        <p style="font-size: 16px; color: #ccc; margin-bottom: 20px;">We encountered an error while fetching your data. Please check your connection or try again later.</p>

    </div>
`;


    }
}

// Function to display shorts
function displayShorts(shorts) {
    let currentShortIndex = 0;

    function renderShort() {
        if (!shorts || shorts.length === 0) {
            container.innerHTML = `<p>No shorts available!</p>`;
            return;
        }

        if (currentShortIndex >= shorts.length) {
            showThankYouMessage("All Shorts Completed!", "You have successfully completed all learning snippets!");
            return;
        }

        const short = shorts[currentShortIndex];
        if (!short.summary || !short.image_path) {
            console.error('Invalid short data:', short);
            container.innerHTML = `<p>Invalid short data!</p>`;
            return;
        }

        container.innerHTML = `
            <div class="shorts-container">
                <h2>Slide Deck ${currentShortIndex + 1}</h2>
                <img src="${short.image_path}" alt="Learning Image" class="short-image">
                <p>${short.summary}</p>
                <div class="short-nav-buttons">
                    <button id="prev-short" class="nav-btn" ${currentShortIndex === 0 ? "disabled" : ""}>Previous</button>
                    <button id="next-short" class="nav-btn">${currentShortIndex === shorts.length - 1 ? "Finish" : "Next"}</button>
                </div>
            </div>
        `;

        document.getElementById('prev-short')?.addEventListener('click', () => {
            if (currentShortIndex > 0) {
                currentShortIndex--;
                renderShort();
            }
        });

        document.getElementById('next-short')?.addEventListener('click', () => {
            if (currentShortIndex < shorts.length - 1) {
                currentShortIndex++;
                renderShort();
            } else {
                showThankYouMessage("All Shorts Completed!", "You have successfully completed all learning snippets!");
            }
        });
    }

    renderShort();
}

// Function to show thank you message
function showThankYouMessage(title, message) {
    container.innerHTML = `
        <div class="quiz-completed">
            <h2>${title}</h2>
            <p>${message}</p>
            <button id="go-home" class="go-home-btn">Go Back Home</button>
        </div>
    `;

    document.getElementById('go-home')?.addEventListener('click', () => {
        window.location.reload();
    });
}

// Submit button handling
// Submit button handling
submitBtn.addEventListener('click', () => {
    // Show options for quiz, GRE styled flashcard, and shorts
    container.innerHTML = `
    <div class="option-container" style="text-align: center; padding: 30px; background-color: #1e1e1e; border-radius: 16px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); max-width: 800px; margin: auto;">
        <h2 style="color: #fff; font-family: 'Roboto', sans-serif; font-size: 28px; font-weight: bold; margin-bottom: 25px;">Choose Your Learning Style</h2>
        <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 30px;">
            <div class="learning-option" style="background-color: #292929; border-radius: 12px; padding: 20px; text-align: center; max-width: 250px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); transition: transform 0.3s ease, box-shadow 0.3s ease;">
                <button id="quiz-btn" class="learning-option-btn" style="
                    padding: 15px 30px; 
                    font-size: 18px; 
                    color: #fff; 
                    background-color: #1db954; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    transition: background-color 0.3s ease, transform 0.2s ease;
                ">Create a Quiz</button>
                <p class="option-description" style="color: #ccc; font-size: 14px; margin-top: 15px;">Test your knowledge by taking a quiz.</p>
            </div>
            <div class="learning-option" style="background-color: #292929; border-radius: 12px; padding: 20px; text-align: center; max-width: 250px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); transition: transform 0.3s ease, box-shadow 0.3s ease;">
                <button id="flashcard-btn" class="learning-option-btn" style="
                    padding: 15px 30px; 
                    font-size: 18px; 
                    color: #fff; 
                    background-color: #007BFF; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    transition: background-color 0.3s ease, transform 0.2s ease;
                ">GRE Styled Flashcard</button>
                <p class="option-description" style="color: #ccc; font-size: 14px; margin-top: 15px;">Learn key terms and concepts with flashcards.</p>
            </div>
            <div class="learning-option" style="background-color: #292929; border-radius: 12px; padding: 20px; text-align: center; max-width: 250px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); transition: transform 0.3s ease, box-shadow 0.3s ease;">
                <button id="shorts-btn" class="learning-option-btn" style="
                    padding: 15px 30px; 
                    font-size: 18px; 
                    color: #fff; 
                    background-color: #FF6F61; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    transition: background-color 0.3s ease, transform 0.2s ease;
                ">Learn as Shorts</button>
                <p class="option-description" style="color: #ccc; font-size: 14px; margin-top: 15px;">Get concise summaries and visuals for easy learning.</p>
            </div>
        </div>
    </div>
`;

    // Add hover effects to the learning option cards
    document.querySelectorAll('.learning-option').forEach((option) => {
        option.addEventListener('mouseover', () => {
            option.style.transform = 'scale(1.05)';
            option.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.5)';
        });

        option.addEventListener('mouseout', () => {
            option.style.transform = 'scale(1)';
            option.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
        });
    });

    // Add event listeners to buttons
    document.getElementById('quiz-btn').addEventListener('click', () => handleLearningOption('quiz'));
    document.getElementById('flashcard-btn').addEventListener('click', () => handleLearningOption('flashcard'));
    document.getElementById('shorts-btn').addEventListener('click', () => handleLearningOption('shorts'));
});


function displayFlashcard(flashcards) {
    let currentFlashcardIndex = 0;

    function renderFlashcard() {
        // Validate flashcard data
        if (!flashcards || flashcards.length === 0) {
            container.innerHTML = `<p>No flashcards available!</p>`;
            return;
        }

        // Check if we've displayed all flashcards
        if (currentFlashcardIndex >= flashcards.length) {
            showThankYouMessage(
                "All Flashcards Completed!",
                "You have successfully completed all flashcards! 🎉"
            );
            return;
        }

        const flashcard = flashcards[currentFlashcardIndex];

        // Ensure flashcard has necessary properties
        if (!flashcard.text || !flashcard.option1 || !flashcard.option2) {
            console.error('Invalid flashcard data:', flashcard);
            container.innerHTML = `<p>Invalid flashcard data!</p>`;
            return;
        }

        // Display the current flashcard
        container.innerHTML = `
            <div class="flashcard-container">
                <h2>${flashcard.text}</h2>
                <div class="flashcard-options">
                    <div class="flashcard-option left" data-option="option1">${flashcard.option1}</div>
                    <div class="flashcard-option right" data-option="option2">${flashcard.option2}</div>
                </div>
                <p id="flashcard-feedback" class="flashcard-feedback"></p>
            </div>
        `;

        const leftOption = document.querySelector('.flashcard-option.left');
        const rightOption = document.querySelector('.flashcard-option.right');
        const feedback = document.getElementById('flashcard-feedback');

        // Pass feedback to handleSwipe
        leftOption.addEventListener('click', () => handleSwipe('option1', flashcard, leftOption, feedback));
        rightOption.addEventListener('click', () => handleSwipe('option2', flashcard, rightOption, feedback));
    }

    renderFlashcard();
}
function handleSwipe(selectedOption, flashcard, element, feedback) {
    const isCorrect = flashcard.correct_option === flashcard[selectedOption];

    if (isCorrect) {
        element.style.backgroundColor = 'green';
        feedback.textContent = 'Correct!';
        feedback.style.color = 'green';
    } else {
        element.style.backgroundColor = 'red';
        feedback.textContent = `Wrong! The correct answer is: ${flashcard.correct_option}`;
        feedback.style.color = 'red';
    }

    // Move to the next flashcard after showing feedback
    setTimeout(() => {
        currentFlashcardIndex++;
        renderFlashcard();
    }, 1500);
}
function renderFlashcard() {
    if (!flashcards || flashcards.length === 0) {
        container.innerHTML = `<p>No flashcards available!</p>`;
        return;
    }

    if (currentFlashcardIndex >= flashcards.length) {
        showThankYouMessage(
            "All Flashcards Completed!",
            "You have successfully completed all flashcards! 🎉"
        );
        return;
    }

    const flashcard = flashcards[currentFlashcardIndex];

    if (!flashcard.text || !flashcard.option1 || !flashcard.option2) {
        console.error('Invalid flashcard data:', flashcard);
        container.innerHTML = `<p>Invalid flashcard data!</p>`;
        return;
    }

    container.innerHTML = `
        <div class="flashcard-container">
            <h2>${flashcard.text}</h2>
            <div class="flashcard-options">
                <div class="flashcard-option left" data-option="option1">${flashcard.option1}</div>
                <div class="flashcard-option right" data-option="option2">${flashcard.option2}</div>
            </div>
            <p id="flashcard-feedback" class="flashcard-feedback"></p>
        </div>
    `;

    const leftOption = document.querySelector('.flashcard-option.left');
    const rightOption = document.querySelector('.flashcard-option.right');
    const feedback = document.getElementById('flashcard-feedback');

    leftOption.addEventListener('click', () => handleSwipe('option1', flashcard, leftOption, feedback));
    rightOption.addEventListener('click', () => handleSwipe('option2', flashcard, rightOption, feedback));
}
function displayQuestion(questions, currentIndex, incorrectQuestions = [], isRetry = false) {
    const totalQuestions = questions.length;
    const questionData = questions[currentIndex];

    container.innerHTML = `
        <div class="question-container">
            <h2>Question ${currentIndex + 1} of ${totalQuestions}</h2>
            <p class="question-text">${questionData.question}</p>
            <div class="options">
                ${questionData.options
                    .map(
                        (option, idx) =>
                            `<div class="option-wrapper">
                                <input type="radio" id="option-${idx}" name="option" value="${option}" />
                                <label for="option-${idx}" class="option-label">${option}</label>
                            </div>`
                    )
                    .join('')}
            </div>
            <button id="submit-answer" class="submit-answer-btn">Submit Answer</button>
            <p id="feedback" class="feedback"></p>
            <div class="loading-bar-wrapper">
                <div class="loading-bar"></div>
            </div>
        </div>
    `;

    const submitAnswerBtn = document.getElementById('submit-answer');
    const feedback = document.getElementById('feedback');

    submitAnswerBtn.addEventListener('click', () => {
        const selectedOption = document.querySelector('input[name="option"]:checked');

        if (!selectedOption) {
            feedback.textContent = 'Please select an option!';
            feedback.style.color = 'orange';
            return;
        }

        const userAnswer = selectedOption.value;

        // Highlight the correct and incorrect options
        let isCorrect = false;
        document.querySelectorAll('input[name="option"]').forEach((radio) => {
            const label = radio.nextElementSibling;
            if (radio.value === questionData.correct_answer) {
                if (radio.checked) {
                    label.style.backgroundColor = 'green';
                    label.style.color = 'white';
                    isCorrect = true;
                } else {
                    label.style.backgroundColor = 'green';
                    label.style.color = 'white';
                }
            } else if (radio.checked) {
                label.style.backgroundColor = 'red';
                label.style.color = 'white';
            }
        });

        if (!isCorrect && !isRetry) {
            incorrectQuestions.push(questionData);
        }

        // Show feedback and a progress bar for moving to the next question
        feedback.textContent = `Going to the next question in 2 seconds...`;
        feedback.style.color = 'white';

        const loadingBar = document.querySelector('.loading-bar');
        loadingBar.style.width = '0%';
        setTimeout(() => {
            loadingBar.style.transition = 'width 2s linear';
            loadingBar.style.width = '100%';
        }, 10);

        // Move to the next question after 2 seconds
        setTimeout(() => {
            const nextIndex = currentIndex + 1;
            if (nextIndex < totalQuestions) {
                displayQuestion(questions, nextIndex, incorrectQuestions, isRetry);
            } else if (!isRetry && incorrectQuestions.length > 0) {
                container.innerHTML = `
                    <div class="quiz-retry">
                        <h2>Let's retry incorrect questions!</h2>
                    </div>
                `;
                setTimeout(() => {
                    displayQuestion(incorrectQuestions, 0, [], true);
                }, 2000);
            } else {
                showThankYouMessage(
                    "Quiz Completed",
                    "You have successfully completed the quiz!"
                );
            }
        }, 2000);
    });
}
