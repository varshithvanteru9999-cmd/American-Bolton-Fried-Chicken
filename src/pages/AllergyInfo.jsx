import React from 'react';
import './Terms.css';

const AllergyInfo = () => {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <h1 style={{ textTransform: 'uppercase' }}>Allergy Information</h1>

        <p>Read the FAQs below for more information about food allergy.</p>

        <p className="faq-q">What if I have a food allergy?</p>
        <p>You should leave a note for the Takeaway on the Checkout Page/Basket or you can contact the Takeaway directly regarding any food allergies you may have. We strongly advise you to contact the Takeaway directly to confirm any allergy requests made online when placing an order.</p>

        <p className="faq-q">How do we make sure that the food allergy information provided is accurate and up to date?</p>
        <p>Your health is our priority and we do not want to risk it so we highly recommend you contact the Takeaway directly to get accurate and up to date information about the food and the preparation of it.</p>

        <p className="faq-q">How do I contact the Takeaway directly?</p>
        <p>The contact details are available on the Takeaway website. You can select the <strong>Contact Us</strong> option to find the Takeaway details.</p>

        <p className="faq-q">Does the law require all food businesses to provide information about food allergies?</p>
        <p>Please contact the Takeaway directly for any information regarding any food allergies.</p>
      </div>
    </div>
  );
};

export default AllergyInfo;
