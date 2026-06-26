"use client";
import Script from "next/script";
export default function HeadClient() {
  return (
    <head>
      {process.env.NODE_ENV === "development" ? (
        <Script
          src="//unpkg.com/react-scan/dist/auto.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      ) : null}
    </head>
  );
}
