# Mechanical Face - Premium Hybrid Watch Face

A premium luxury smartwatch face featuring continuous sweep mechanics, digital time & date readout, animated weather indicators, and high-fidelity customization dashboard.

## Features

- **Mechanical Sweep Movement**: Smooth continuous sweep second hand and animated mechanical components
- **Hybrid Display**: Premium analog watch face with digital time and date readout
- **Weather Integration**: Animated weather indicators with sun/moon sub-dial (moon 6pm–6am, sun otherwise)
- **Customizable Themes**: Multiple accent color themes for personalization
- **Interactive Controls**: Compact dropdown menu for quick access to settings
- **Responsive Design**: Fullscreen-optimized layout that adapts to any device
- **Progressive Web App**: Installable as a PWA with offline support via service worker
- **High-Fidelity Animations**: Smooth, professional-quality watch hand and pointer geometry

## Getting Started

### Prerequisites

- Modern web browser with support for:
  - CSS Grid & Flexbox
  - CSS animations
  - JavaScript ES6+
  - Service Workers (for PWA functionality)

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. (Optional) Install as a PWA by using your browser's "Install" option

### Development

The project consists of:
- `index.html` - Main application structure
- `index.css` - Styles for watch face, controls, and themes
- `index.js` - Application logic and interactivity
- `sw.js` - Service worker for offline support
- `manifest.json` - PWA manifest configuration

## Usage

### Viewing the Watch Face

Simply open the application to see the mechanical watch face in fullscreen mode.

### Customization

Click on the watch face to reveal the controls dropdown menu, which includes:
- **Accent Theme**: Change the watch face color theme
- **Interactive Controls**: Toggle various interactive features

### Supported Themes

The application supports multiple accent color themes via the `theme-` class system in the CSS.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supporting PWA standards

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created with attention to premium design and smooth mechanical interaction.

---

**Note**: This watch face is designed for optimal viewing on square smartwatch displays but adapts gracefully to any screen size.
