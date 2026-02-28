import React, { useEffect, useState } from "react";
import API from "../../../api/axios";
import "./Homepage.scss";

const Homepage = () => {
  const serverUrl = process.env.REACT_APP_API_URL;
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await API.get("/api/globaldetails/details");
        setSiteData(res.data);
      } catch (err) {
        console.error("Error fetching homepage content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  if (loading)
    return <div className="loading-state">Loading Experience...</div>;

  return (
    <div className="homepage-content">
      <section
        className="hero-banner"
        style={{
          backgroundImage: siteData?.hero_image
            ? `url(${serverUrl}/${siteData.hero_image})`
            : "none",
        }}
      >
        <div className="hero-overlay">
          <h1>{siteData?.hero_title}</h1>
        </div>
      </section>

      <section className="welcome-section">
        <h2>{siteData?.welcome_title}</h2>
        <div className="orange-line"></div>
        <p>{siteData?.welcome_description}</p>
      </section>

      <section className="features-grid">
        <div className="feature-row">
          <div className="feature-img">
            <img
              src={`${serverUrl}/${siteData?.feature1_image}`}
              alt={siteData?.feature1_title}
            />
          </div>
          <div className="feature-text teal-bg">
            <h3>{siteData?.feature1_title}</h3>
            <p>{siteData?.feature1_description}</p>
          </div>
        </div>

        <div className="feature-row reverse">
          <div className="feature-img">
            <img
              src={`${serverUrl}/${siteData?.feature2_image}`}
              alt={siteData?.feature2_title}
            />
          </div>
          <div className="feature-text dark-green-bg">
            <h3>{siteData?.feature2_title}</h3>
            <p>{siteData?.feature2_description}</p>
          </div>
        </div>

        <div className="feature-row">
          <div className="feature-img">
            <img
              src={`${serverUrl}/${siteData?.feature3_image}`}
              alt={siteData?.feature3_title}
            />
          </div>
          <div className="feature-text light-gray-bg">
            <h3>{siteData?.feature3_title}</h3>
            <p>{siteData?.feature3_description}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
