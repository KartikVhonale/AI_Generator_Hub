# 🎨 AI Image Generator

A beautiful, modern React application for generating images using Google's Gemini AI API. Built with React + Vite for optimal performance and developer experience.

## ✨ Features

- **AI-Powered Image Generation**: Create stunning images from text descriptions using Google Gemini
- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Real-time Generation**: Watch your images come to life with loading animations
- **Download Functionality**: Save your generated images directly to your device
- **Secure API Key Handling**: Your API key is stored locally and never sent to external servers
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone or download this project**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your Gemini API key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key
   - Create a `.env` file in the project root and add:
     ```
     VITE_GEMINI_API_KEY=your_actual_api_key_here
     ```
   - Replace `your_actual_api_key_here` with your real API key

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## 🎯 How to Use

1. **API Key Setup**: Your API key is automatically loaded from the `.env` file. You can also override it by entering a different key in the input field.
2. **Describe your image**: Write a detailed description of the image you want to generate
3. **Generate**: Click the "Generate Image" button and wait for your masterpiece
4. **Download**: Once generated, click "Download Image" to save it to your device

### Tips for Better Results

- **Be specific**: Instead of "a cat", try "a fluffy orange tabby cat sitting in a sunlit window"
- **Include details**: Mention colors, lighting, style, and mood
- **Specify art style**: Add terms like "photorealistic", "watercolor", "digital art", etc.
- **Set the scene**: Describe the environment, background, and atmosphere

## 🛠️ Built With

- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Google Generative AI SDK** - Official SDK for Gemini API
- **Modern CSS** - Beautiful gradients, animations, and responsive design

## 📁 Project Structure

```
src/
├── App.jsx          # Main application component
├── App.css          # Application styles
├── main.jsx         # React entry point
└── index.css        # Global styles
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔒 Security Note

Your Gemini API key is stored locally in your browser and is never transmitted to any external servers except Google's Gemini API. The key is used only for image generation requests.

## 🎨 Customization

The application is built with modern CSS and is highly customizable. You can easily modify:

- Color schemes in `src/App.css`
- Layout and spacing
- Animations and transitions
- Typography and fonts

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Google Gemini AI for the powerful image generation capabilities
- React team for the amazing framework
- Vite team for the fast build tool

---

**Happy creating! 🎨✨**
