"use client";
import { useEffect, useState } from "react";

export default function Client() {
  const [userId, setUserId] = useState("");
  useEffect(() => {
    setUserId(localStorage.getItem("user") || "");
  });
  return (
    <div>
      <div className="pt-7 pl-7">
        <span className="italic text-2xl">
          <span className="text-bold">{userId || "使用者"}</span>{" "}
          <span className="">您好!</span>
        </span>
      </div>
    </div>
  );
}
