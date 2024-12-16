import time
import requests
from PIL import Image
from io import BytesIO

def download_image(prompt, output_file):
    # Construct the URL
    url = f"https://image.pollinations.ai/prompt/{prompt}"

    print(f"Fetching image for prompt: {prompt}...")

    # Poll the URL until the image is generated
    while True:
        try:
            response = requests.get(url, stream=True)
            if response.status_code == 200 and 'image' in response.headers['Content-Type']:
                # Image generated, break the loop
                print("Image generated successfully!")
                break
            else:
                print("Image not ready yet, waiting...")
        except requests.RequestException as e:
            print(f"Error fetching the image: {e}")
        
        # Wait before retrying
        time.sleep(5)
    
    # Save the image locally
    try:
        image = Image.open(BytesIO(response.content))
        image.save(output_file)
        print(f"Image saved as {output_file}")
    except Exception as e:
        print(f"Failed to save image: {e}")

# Prompt for the image
prompt = "Fuzzy bunnies in my kitchen"
output_file = "generated_image.png"

# Download the image
download_image(prompt, output_file)
