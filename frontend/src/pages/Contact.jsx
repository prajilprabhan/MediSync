import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  ShieldCheck,
  HeartPulse,
  Pill,
  Sparkles,
  CheckCircle,
} from "lucide-react";

import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Temporary frontend-only submission
    console.log("Contact Form Data:", formData);

    setSubmitted(true);

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });

    setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  };

  return (
    <main className="contact-page">

      {/* ================= HERO ================= */}

      <section className="contact-hero">

        <div className="contact-bg-effects">
          <div className="contact-glow glow-one"></div>
          <div className="contact-glow glow-two"></div>
          <div className="contact-glow glow-three"></div>
        </div>

        <div className="floating-contact-icon floating-pill">
          <Pill size={25} />
        </div>

        <div className="floating-contact-icon floating-heart">
          <HeartPulse size={25} />
        </div>

        <div className="floating-contact-icon floating-message">
          <MessageCircle size={25} />
        </div>

        <div className="contact-hero-content">

          <div className="contact-badge">
            <Sparkles size={17} />
            <span>We'd Love to Hear From You</span>
          </div>

          <h1>
            Get in Touch with
            <span> MediSync</span>
          </h1>

          <p>
            Have a question about MediSync, the project, or drug interaction
            analysis? Send us a message and connect with our team.
          </p>

        </div>

        <div className="contact-wave"></div>

      </section>


      {/* ================= CONTACT CONTENT ================= */}

      <section className="contact-main-section">

        <div className="contact-container">

          {/* LEFT SIDE */}

          <div className="contact-info">

            <div className="contact-section-tag">
              <MessageCircle size={17} />
              CONTACT US
            </div>

            <h2>
              Let's Start a
              <span> Conversation</span>
            </h2>

            <p className="contact-intro">
              Whether you have a question, suggestion, or feedback about
              MediSync, we'd be happy to hear from you. Your feedback helps us
              improve the platform and create a better experience.
            </p>


            {/* CONTACT CARDS */}

            <div className="contact-info-cards">

              <div className="contact-info-card">

                <div className="contact-card-icon">
                  <Mail size={24} />
                </div>

                <div>
                  <span>Email Us</span>
                  <h4>prajilprabhan26.com</h4>
                  <p>Send us your questions anytime</p>
                </div>

              </div>


              <div className="contact-info-card">

                <div className="contact-card-icon">
                  <Phone size={24} />
                </div>

                <div>
                  <span>Call Us</span>
                  <h4>+ 91 9982923390</h4>
                  <p>Monday to Friday, 9 AM – 5 PM</p>
                </div>

              </div>


              <div className="contact-info-card">

                <div className="contact-card-icon">
                  <MapPin size={24} />
                </div>

                <div>
                  <span>Location</span>
                  <h4>Kerala, India</h4>
                  <p>MediSync Project Development</p>
                </div>

              </div>

            </div>


            {/* SAFETY BOX */}

            <div className="contact-safety-box">

              <div className="contact-safety-icon">
                <ShieldCheck size={30} />
              </div>

              <div>
                <h4>Medical Emergency?</h4>

                <p>
                  MediSync is not an emergency medical service. For urgent
                  medical concerns, contact a qualified healthcare professional
                  or your local emergency service immediately.
                </p>
              </div>

            </div>

          </div>


          {/* ================= FORM ================= */}

          <div className="contact-form-wrapper">

            <div className="form-decoration form-dot-one"></div>
            <div className="form-decoration form-dot-two"></div>

            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >

              <div className="form-header">

                <div className="form-header-icon">
                  <Send size={25} />
                </div>

                <div>
                  <span>SEND A MESSAGE</span>
                  <h3>How can we help?</h3>
                </div>

              </div>


              <div className="form-row">

                <div className="input-group">
                  <label htmlFor="name">
                    Your Name
                  </label>

                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>


                <div className="input-group">
                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

              </div>


              <div className="input-group">

                <label htmlFor="subject">
                  Subject
                </label>

                <input
                  type="text"
                  id="subject"
                  name="subject"
                  placeholder="What would you like to discuss?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="input-group">

                <label htmlFor="message">
                  Your Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>

              </div>


              <button
                type="submit"
                className="send-message-btn"
              >
                <span>Send Message</span>

                <div className="send-icon">
                  <Send size={19} />
                </div>
              </button>


              {/* SUCCESS MESSAGE */}

              {submitted && (
                <div className="success-message">

                  <CheckCircle size={22} />

                  <div>
                    <strong>Message Sent!</strong>

                    <p>
                      Thank you for contacting MediSync.
                    </p>
                  </div>

                </div>
              )}

            </form>

          </div>

        </div>

      </section>


      {/* ================= BOTTOM SECTION ================= */}

      <section className="contact-bottom-section">

        <div className="contact-bottom-icon">
          <HeartPulse size={38} />
        </div>

        <div>
          <span>MEDISYNC SUPPORT</span>

          <h2>
            Your questions help us build a better healthcare experience.
          </h2>

          <p>
            We value feedback and suggestions that can help improve MediSync
            and make drug interaction information easier to understand.
          </p>
        </div>

      </section>

    </main>
  );
}

export default Contact;