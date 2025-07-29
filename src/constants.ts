export const explanations = {
  issues: {
    rules: {
      // Generate enhanced explanations based on the rule
      "WCAG 1.1.1": {
        detailedExplanation:
          "Images and other non-text content must have alternative text that serves the same purpose and conveys the same information as the visual content. This ensures that users who cannot see images can still understand the content through screen readers or other assistive technologies.",
        userImpact:
          "Users who are blind or have low vision rely on screen readers to understand web content. Without alternative text, images are completely inaccessible to these users, creating a significant barrier to understanding the page content.",
        why: "Alternative text is the primary way that visual information is made accessible to users with visual impairments. It also helps when images fail to load and provides context for search engines.",
        assistiveTechnologyImpact:
          'Screen readers will either skip the image entirely (providing no information) or announce "image" or the filename, which is rarely meaningful to users.',
        howToFix: {
          steps: [
            "Add an alt attribute to every img element",
            "Write descriptive text that conveys the purpose and content of the image",
            'For decorative images, use alt="" (empty alt attribute)',
            "For complex images, consider using aria-describedby to reference detailed descriptions",
          ],
          badExample: '<img src="chart.jpg">',
          goodExample:
            '<img src="chart.jpg" alt="Sales increased 25% from Q1 to Q2 2024">',
          codeExample: `<!-- For informative images -->
<img src="logo.jpg" alt="Company Name - Building Better Websites">

<!-- For decorative images -->
<img src="decorative-border.jpg" alt="">

<!-- For complex images -->
<img src="complex-chart.jpg" alt="Quarterly sales data" aria-describedby="chart-description">
<div id="chart-description">
  Detailed description of the chart data...
</div>`,
        },
        relatedGuidelines: [
          "WCAG 2.1 Success Criterion 1.1.1 Non-text Content",
        ],
        documentationLinks: [
          "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html",
          "https://webaim.org/articles/alt/",
        ],
      },
      "WCAG 1.3.1 - default": {
        detailedExplanation:
          "Heading elements (h1-h6) should follow a logical hierarchy without skipping levels. This creates a meaningful document structure that assistive technology users can navigate efficiently.",
        userImpact:
          "Screen reader users often navigate by headings using keyboard shortcuts. A logical heading structure allows them to quickly understand page organization and jump to relevant sections.",
        why: "Heading hierarchy provides semantic structure to content, similar to an outline. Skipping levels breaks this logical flow and can confuse users about content relationships.",
        assistiveTechnologyImpact:
          "Screen readers provide heading navigation features that rely on proper hierarchy. Skipped levels can make users think they missed content or that the structure is broken.",
        howToFix: {
          steps: [
            "Start with h1 for the main page title",
            "Use h2 for major sections",
            "Use h3 for subsections under h2, and so on",
            "Never skip heading levels (don't go from h2 to h4)",
            "Consider your content outline when choosing heading levels",
          ],
          badExample: "<h1>Main Title</h1>\n<h4>Subsection</h4>",
          goodExample:
            "<h1>Main Title</h1>\n<h2>Section</h2>\n<h3>Subsection</h3>",
          codeExample: `<!-- Good heading structure -->
<h1>Article Title</h1>
<h2>Introduction</h2>
<h2>Main Content</h2>
<h3>Subsection A</h3>
<h3>Subsection B</h3>
<h4>Detail under B</h4>
<h2>Conclusion</h2>`,
        },
      },
      "WCAG 1.3.1 - skip": {
        detailedExplanation:
          "Form controls must have accessible labels so users can understand what information is requested. Labels create programmatic relationships between the text and the control.",
        userImpact:
          "Users with visual impairments rely on screen readers to understand form fields. Without proper labels, they cannot determine what information to enter in each field.",
        why: "Labels provide essential context for form fields. They must be programmatically associated with controls so assistive technology can announce them when the field receives focus.",
        assistiveTechnologyImpact:
          'Screen readers will announce unlabeled fields as "edit text" or similar generic terms, providing no context about what information is expected.',
        howToFix: {
          steps: [
            "Use <label> elements with for attributes pointing to the input ID",
            "Alternatively, use aria-label for concise labels",
            "Use aria-labelledby to reference existing text as a label",
            "Ensure every form control has an accessible name",
          ],
          badExample: '<input type="email">',
          goodExample:
            '<label for="email">Email Address</label>\n<input type="email" id="email">',
          codeExample: `<!-- Using label element -->
<label for="email">Email Address</label>
<input type="email" id="email" required>

<!-- Using aria-label -->
<input type="email" aria-label="Email Address" required>

<!-- Using aria-labelledby -->
<h3 id="contact-heading">Contact Information</h3>
<input type="email" aria-labelledby="contact-heading">

<!-- For groups of related fields -->
<fieldset>
  <legend>Shipping Address</legend>
  <label for="street">Street Address</label>
  <input type="text" id="street">
</fieldset>`,
        },
        relatedGuidelines: [
          "WCAG 2.1 Success Criterion 1.3.1 Info and Relationships",
        ],
        documentationLinks: [
          "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html",
          "https://webaim.org/techniques/forms/",
        ],
      },
      default: {
        detailedExplanation:
          "This accessibility issue affects how users with disabilities can perceive, understand, navigate, and interact with web content.",
        userImpact:
          "May create barriers for users with disabilities, including those using screen readers, keyboard navigation, or other assistive technologies.",
        why: "Following accessibility guidelines ensures that web content is usable by the widest possible range of people, including those with disabilities.",
        assistiveTechnologyImpact:
          "May cause assistive technologies to provide incomplete or confusing information to users.",
        howToFix: {
          steps: [
            "Review the specific issue details",
            "Consult WCAG guidelines for detailed solutions",
            "Test with assistive technology if possible",
          ],
          codeExample: "// Specific fix depends on the issue context",
        },
        relatedGuidelines: ["WCAG 2.1 Guidelines"],
        documentationLinks: ["https://www.w3.org/WAI/WCAG21/"],
      },
    },
  },
};
