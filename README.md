# Template Matching React

This project is a React application that uses Vite for fast development and build processes. It includes various tools and libraries to facilitate template matching and image processing. The backend is powered by an AWS Lambda function that uses OpenCV (cv2) for image processing.

## Features

- **Upload Support**: Allows users to upload both PDF and image files for processing.
- **Image Cropping**: Provides functionality to crop symbols from uploaded images.
- **Drawing Tools**: Enables users to draw symbols on images.
- **Labeling and Coloring**: Allows users to assign labels and colors to symbols for easy identification.
- **Symbol Verification**: Provides a feature to verify detected symbols.

- **gh-pages**: A utility for deploying projects to GitHub Pages.
- **AWS Lambda**: Serverless compute service that runs backend code.
- **Terraform**: Infrastructure as Code tool for deploying AWS resources.

## Available Scripts

- `dev`: Starts the development server using Vite.
- `build`: Builds the project for production using Vite.
- `lint`: Runs ESLint to check for linting issues.
- `preview`: Previews the production build using Vite.
- `predeploy`: Builds the project before deployment.
- `deploy`: Deploys the project to GitHub Pages.

## Getting Started

1. Clone the repository:
   ```sh
   git clone https://github.com/ikram9820/template_matching.git
   ```
2. Install dependencies:
    ```sh
    npm install
    ```
3. Start the development server:
    ```sh
    npm run dev
    ```

## Deploying the Lambda Function with Terraform

1. Navigate to the terraform directory:
   ```sh
    cd terraform
    ```
2. Initialize Terraform:
   ```sh
    terraform init
    ```
3. Create a zip file for the Lambda function:
   ```sh
    zip lambda_function.zip lambda_function.py
    ```
4. Create a directory for the Lambda layer:
   ```sh
    mkdir lambda_layer
    ```
5. Install the required Python packages into the Lambda layer:
   ```sh
    pip install --target lambda_layer opencv-python-headless numpy Pillow
    ```
6. Zip the Lambda layer:
   ```sh
    zip -r lambda_layer.zip lambda_layer
    ```
7. Apply the Terraform configuration to deploy the Lambda function and API Gateway:
    ```sh
    terraform apply
    ```
## Deployment
To deploy the project to GitHub Pages, run:
    ```sh
     npm run deploy
    ```
