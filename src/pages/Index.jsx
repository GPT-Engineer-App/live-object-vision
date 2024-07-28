import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

const Index = () => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [model, setModel] = useState(null);
  const [selectedModel, setSelectedModel] = useState('cocossd');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadModel();
  }, [selectedModel]);

  const loadModel = async () => {
    try {
      if (selectedModel === 'cocossd') {
        const loadedModel = await cocossd.load();
        setModel(loadedModel);
      }
      // Add more models here if needed
    } catch (error) {
      console.error('Failed to load the model:', error);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsWebcamActive(true);
      detectObjects();
    } catch (error) {
      console.error('Error accessing the webcam:', error);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsWebcamActive(false);
  };

  const detectObjects = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const detectFrame = async () => {
      if (isWebcamActive) {
        const predictions = await model.detect(video);
        
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);

        predictions.forEach(prediction => {
          const [x, y, width, height] = prediction.bbox;
          ctx.strokeStyle = '#00FFFF';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = '#00FFFF';
          ctx.fillText(
            `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
            x,
            y > 10 ? y - 5 : 10
          );
        });

        requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  };

  const toggleWebcam = () => {
    if (isWebcamActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Real-Time Object Detection</h1>
        <p className="text-xl">Using TensorFlow.js</p>
      </header>

      <div className="flex justify-center mb-4">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full max-w-2xl"
            style={{ display: isWebcamActive ? 'block' : 'none' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </div>

      <div className="flex justify-center space-x-4 mb-8">
        <Button onClick={toggleWebcam}>
          {isWebcamActive ? 'Stop Webcam' : 'Start Webcam'}
        </Button>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cocossd">COCO-SSD</SelectItem>
            {/* Add more models here if needed */}
          </SelectContent>
        </Select>
      </div>

      <footer className="text-center text-sm text-gray-500">
        <a
          href="https://www.tensorflow.org/js"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          TensorFlow.js Documentation
        </a>
      </footer>
    </div>
  );
};

export default Index;