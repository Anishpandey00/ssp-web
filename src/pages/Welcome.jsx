import styled from "styled-components";
import { useNavigate } from "react-router-dom";


const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #e9e3fb;
  font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
`;

const Nav = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 3rem;
  background: #ffffff;
  border-bottom: 1px solid #ddd4f3;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 600;
  color: #2a2a2a;
  font-size: 1.1rem;
`;

const Logo = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #2e7d32;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

const Hero = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  padding: 4rem 3rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 3rem 1.5rem;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  @media (max-width: 860px) {
    align-items: center;
  }
`;

const Badge = styled.span`
  align-self: flex-start;
  background: #ffffff;
  color: #2e7d32;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;

  @media (max-width: 860px) { align-self: center; }
`;

const Title = styled.h1`
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.1;
  color: #1a1a1a;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #444;
  line-height: 1.6;
  margin: 0;
  max-width: 460px;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.85rem;
  margin-top: 0.5rem;

  @media (max-width: 860px) { justify-content: center; }
`;

const PrimaryBtn = styled.button`
  background: #2e7d32;
  color: #fff;
  border: none;
  padding: 0.9rem 1.7rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    background: #276a2a;
    transform: translateY(-2px);
  }
`;

const ImageWrap = styled.div`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(80, 60, 140, 0.18);
`;

const HeroImg = styled.img`
  width: 100%;
  display: block;
  aspect-ratio: 4 / 3;
  object-fit: cover;
`;

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1.2rem 3rem;
  background: #ffffff;
  border-top: 1px solid #ddd4f3;
  font-size: 0.85rem;
  color: #777;
`;

const FooterLinks = styled.nav`
  display: flex;
  gap: 1.3rem;
  a { color: #777; text-decoration: none; }
  a:hover { color: #2e7d32; }
`;

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <Page>
      <Nav>
        <Brand>
          <Logo>📚</Logo>
          Smart Study Planner
        </Brand>
      </Nav>

      <Hero>
        <Content>
          <Badge>Plan smarter, not harder</Badge>
          <Title>Smart Study Planner</Title>
          <Subtitle>
            Organize your studies and maximize your success with structured
            plans, progress tracking, and timely reminders.
          </Subtitle>
          <Actions>
            <PrimaryBtn onClick={() => navigate("/login")}>
              Let's begin →
            </PrimaryBtn>
          </Actions>
        </Content>

        <ImageWrap>
          <HeroImg src="/study-desk.png" alt="Organized study desk" />
        </ImageWrap>
      </Hero>

      <Footer>
        <span>© {new Date().getFullYear()} Smart Study Planner. All rights reserved.</span>
        <FooterLinks>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </FooterLinks>
      </Footer>
    </Page>
  );
}