import styled from "styled-components";
import { useNavigate } from "react-router-dom";


const Page = styled.div`
  min-height: calc(100vh - 56px);
  width: min(1120px, calc(100% - 48px));
  margin: 28px auto;
  border-radius: 24px;
  border: 1px solid #ffffff85;
  overflow: hidden;
  box-shadow: 0 26px 70px -42px rgba(29, 27, 46, .5);
  @media (max-width: 600px) {
    width: calc(100% - 24px);
    min-height: calc(100vh - 24px);
    margin: 12px auto;
    border-radius: 20px;
  }
  display: flex;
  flex-direction: column;
  background: var(--paper);
  font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
`;

const Nav = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: transparent;
  border-bottom: 1px solid var(--line);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 600;
  color: var(--ink);
  font-size: 1.1rem;
`;

const Logo = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent);
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
  background: transparent;
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;

  @media (max-width: 860px) { align-self: center; }
`;

const Title = styled.h1`
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  letter-spacing: -0.045em;
  font-weight: 650;
  line-height: 1.1;
  color: var(--ink);
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--ink-soft);
  line-height: 1.6;
  margin: 0;
  max-width: 460px;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;

  @media (max-width: 860px) { justify-content: center; }
`;

const PrimaryBtn = styled.button`
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 0.9rem 1.7rem;
  border-radius: 13px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    background: var(--accent-dark);
    box-shadow: 0 6px 14px -8px rgba(48, 118, 45, 0.35);
  }
`;

const ImageWrap = styled.div`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 36px -24px rgba(29, 27, 46, 0.28);
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
  padding: 1.2rem 2rem;
  background: transparent;
  border-top: 1px solid var(--line);
  font-size: 0.85rem;
  color: var(--ink-soft);
`;

const FooterLinks = styled.nav`
  display: flex;
  gap: 1.3rem;
  a { color: var(--ink-soft); text-decoration: none; }
  a:hover { color: var(--accent); }
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