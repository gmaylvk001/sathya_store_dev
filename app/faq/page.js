"use client";
import { useState, useEffect } from "react";

import FeedbackComponent from "@/components/feedback/feedback";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <FeedbackComponent /> {/* Use the Home component here */}
    </div>
  );
}
