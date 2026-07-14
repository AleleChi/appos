# AppOS Registration Engine (Signup Screen)

## Purpose
The AppOS Signup Screen is the gateway of the AppOS user journey. It transitions visitors into workspace creators. Built with high fidelity to match the visual specification of the Stitch designs, it provides both mobile and desktop responsive views and acts as a secure container for initial credential collection.

## User Flow
1. **Initiation**: The visitor clicks a "Get Started" or "Start Free" CTA across the main site (Navbar, Hero, CTASection, Pricing, or Security pages).
2. **Landing**: The user is brought to the Signup screen.
   - **Desktop (1440px)**: Displays a premium two-column branding & processing visualization layout. The left column shows a live technical simulation of the AppOS Website Analysis pipeline, reinforcing platform value. The right column renders the centered, crisp white form.
   - **Mobile (390px) & Tablet (768px)**: Converts into a streamlined, high-contrast single-column layout showcasing branding, the input form, social identity providers, and helpful redirection anchors.
3. **Information Intake**: The user provides a work email and password, or initiates an OAuth handshake.
4. **Validation Check**: Password strength and email formats are evaluated dynamically.
5. **Simulated Handshake**: Clicking "Create Account" activates a simulated registration delay (1.5s), transitioning to a secure "Account Created" card detailing the tenant isolation checks.
6. **Workspace Redirect**: The UI automatically routes the newly created user session forward to the Workspace Creation onboarding step.

## Components Used
All elements adhere to the AppOS design system tokens (`/src/components/MarketingCore.tsx` and `/src/index.css`):
* **`AuthLayout`**: Two-column layout grid wrapper with beautiful radial blue/mesh glow accents for modern styling.
* **`AuthLogo`**: Brand identification vectors.
* **`LeftPanel`**: Mock terminal pipeline with real-time DOM parsers and output file compilation schemas, built entirely with native tailwind containers and `JetBrains Mono`.
* **`FormField`**: Adaptive input container handling responsive text/label swaps (e.g. "Work Email" vs "Email address") and error borders.
* **`PasswordField`**: Secured text input with visibility eye-slash toggle and dynamic password strength evaluation.
* **`SocialAuthButton`**: Google & Apple identity buttons with responsive hover scales and crisp official SVG brand marks.
* **`Divider`**: Standard horizontal text boundary.
* **`PrimaryButton`**: Branded CTA button with automated loading feedback spinners.

## Validation Behaviour
* **Email Format**: A robust client-side regular expression check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) ensures credentials match corporate standards. Errors are cleared instantly when typing resumes.
* **Password Complexity**:
  * Evaluates minimum character requirements (8+ characters).
  * Measures security strength across lowercase, uppercase, numerical, and special characters.
  * Updates a dynamic 4-segment gauge bar underneath the input in real-time, accompanied by descriptive label prose ("Too Short", "Weak", "Fair", "Good", "Strong").
* **Execution Guards**: Submit actions are disabled during active validation faults and network loading sequences.

## Backend Integration Expectations
This interface is prepared to bind directly with real backend servers:
* **Target Endpoint**: `POST /api/auth/signup`
* **JSON Request Payload**:
  ```json
  {
    "email": "name@company.com",
    "password": "hashed_or_plain_password",
    "provider": "email" // or "google" | "apple"
  }
  ```
* **Expected JSON Success Response**:
  ```json
  {
    "success": true,
    "message": "Your AppOS account has been successfully created.",
    "data": {
      "user": {
        "id": "usr_94f83kd1",
        "email": "name@company.com",
        "createdAt": "2026-07-13T16:00:00Z"
      },
      "verificationRequired": false,
      "redirectUrl": "/workspace-creation"
    }
  }
  ```
