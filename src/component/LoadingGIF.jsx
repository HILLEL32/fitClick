import React from "react";
import loadingGIF from "../photos/loadingGIF.gif";
import '../css/LoadingGIF.css';
// לא טופל
export default function LoadingGif({ fullScreen = false, label = "טוען..." }) {
  if (fullScreen) {
    return (
      <div className="loading-overlay" role="status" aria-live="polite">
        <img src={gif} alt={label} className="loading-img" />
      </div>
    );
  }
  return (
    <span className="loading-inline" role="status" aria-live="polite">
      <img src={gif} alt={label} className="loading-img--inline" />
    </span>
  );
}
