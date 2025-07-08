# SprintPilot

This is a Next.js and Genkit application built in Firebase Studio. It uses **Firebase Firestore** for data storage.

## Running Locally

To run this application on your own machine, follow these steps.

### 1. Download the Code

Use the **Download code** button in the Firebase Studio interface to download the project files as a ZIP archive, then unzip it.

### 2. Install Dependencies

Open your terminal, navigate into the project directory, and run the following command to install the necessary packages:

```bash
npm install
```

### 3. Set Up a Firebase Project

This application requires a Firebase project to use Firestore.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the on-screen instructions to create a new project.
3.  Once your project is created, navigate to the **Project Overview** page. Click the **Web** icon (`</>`) to add a web app to your project.
4.  Give your app a nickname and click **"Register app"**.
5.  Firebase will provide you with a `firebaseConfig` object. You will need these values for the next step.
6.  In your new project, go to the **Build** section in the left-hand menu and select **Firestore Database**.
7.  Click **"Create database"**.
8.  Choose to start in **"test mode"** (this allows easy read/write access for development) and select a location. Click **"Enable"**.

### 4. Set Up Environment Variables

The application needs your Firebase project configuration and a Google Gemini API key.

1.  **Get your Gemini API Key**:
    *   Get your free Gemini API key from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.

2.  **Create your local environment file**:
    *   In the project's root directory, make a copy of the `.env` file and rename it to `.env.local`.

3.  **Add your API Key to `.env.local`**:
    ```
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```

4.  **Find and Add your Firebase Keys to `.env.local`**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and select your project.
    *   Click the gear icon (⚙️) next to "Project Overview" and select **Project settings**.
    *   Scroll down to the **"Your apps"** card.
    *   In the **"SDK setup and configuration"** section, select the **Config** radio button.
    *   You will see a `firebaseConfig` object. Copy the values from this object into your `.env.local` file like so:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    ```

### 5. Run the Development Servers

You will need to run two separate processes in two different terminal windows.

**In your first terminal**, run the Next.js web application:

```bash
npm run dev
```

**In your second terminal**, run the Genkit AI flows:

```bash
npm run genkit:dev
```

### 6. Open the App

Once both servers are running, you can open your web browser and navigate to:

[http://localhost:9002](http://localhost:9002)

You should now see the application running locally! You can start by creating your first sprint.
