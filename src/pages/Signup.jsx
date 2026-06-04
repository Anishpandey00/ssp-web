import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/backend.js";
import { useAuth } from "../context/AuthContext.jsx";

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9e3fb;
  font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
  padding: 1.5rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 18px 40px rgba(80, 60, 140, 0.18);
`;

const Logo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #2e7d32;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-bottom: 1.4rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.4rem;
`;

const Subtitle = styled.p`
  color: #555;
  margin: 0 0 1.8rem;
  font-size: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.45rem;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: #f0ecfb;
  border: 1px solid ${(p) => (p.$error ? "#d32f2f" : "transparent")};
  border-radius: 10px;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    border-color: #2e7d32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
  }
`;

const PasswordWrap = styled.div`
  position: relative;
`;

const ToggleBtn = styled.button`
  position: absolute;
  top: 50%;
  right: 0.6rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #2e7d32;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.3rem 0.5rem;

  &:hover { text-decoration: underline; }
`;

const ErrorMsg = styled.small`
  display: block;
  color: #d32f2f;
  font-size: 0.82rem;
  margin: 0.35rem 0 0;
`;

const Field = styled.div`
  margin-bottom: 1.1rem;
`;

const SignupBtn = styled.button`
  width: 100%;
  background: #2e7d32;
  color: #fff;
  border: none;
  padding: 0.95rem;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.6rem;
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover:not(:disabled) {
    background: #276a2a;
    transform: translateY(-2px);
  }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

const LoginLine = styled.p`
  text-align: center;
  color: #555;
  margin-top: 1.4rem;
  font-size: 0.95rem;

  a {
    color: #2e7d32;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }
  a:hover { text-decoration: underline; }
`;

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = { name: "", email: "", password: "" };
    let ok = true;

    if (name.trim().length < 2) {
      next.name = "Please enter your full name.";
      ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Please enter a valid email address.";
      ok = false;
    }
    if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
      ok = false;
    }

    setErrors(next);
    return ok;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setServerError("");
    setLoading(true);
    const res = await registerUser({ name, email, password });
    setLoading(false);

    if (!res.ok) {
      setServerError(res.error || "Sign up failed.");
      return;
    }

    login(res.user);
    navigate("/dashboard");
  };

  return (
    <Page>
      <Card>
        <Logo>📚</Logo>
        <Title>Create account</Title>
        <Subtitle>Start planning your study sessions today.</Subtitle>

        <Field>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            $error={!!errors.name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <ErrorMsg>{errors.name}</ErrorMsg>}
        </Field>

        <Field>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            $error={!!errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <ErrorMsg>{errors.email}</ErrorMsg>}
        </Field>

        <Field>
          <Label htmlFor="password">Password</Label>
          <PasswordWrap>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              $error={!!errors.password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "4rem" }}
            />
            <ToggleBtn type="button" onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? "Hide" : "Show"}
            </ToggleBtn>
          </PasswordWrap>
          {errors.password && <ErrorMsg>{errors.password}</ErrorMsg>}
        </Field>

        {serverError && <ErrorMsg style={{ marginBottom: "0.5rem" }}>{serverError}</ErrorMsg>}

        <SignupBtn onClick={handleSignup} disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </SignupBtn>

        <LoginLine>
          Already have an account? <a onClick={() => navigate("/login")}>Log in</a>
        </LoginLine>
      </Card>
    </Page>
  );
}
