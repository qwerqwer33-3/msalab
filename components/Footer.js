import { withBasePath } from "../lib/basePath";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footerInner">
        <div className="footerTop">
          <div className="footerBrand">
            <img
              className="footerLogoFull"
              src={withBasePath("/LAB_logo.png")}
              width="2804"
              height="561"
              alt="Materials Modeling Laboratory"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="footerGrid">
            <div className="footerBlock">
              <div className="footerLabel">Address</div>
              <div className="footerValue">Sungkyunkwan University, Republic of Korea</div>
            </div>
            <div className="footerBlock">
              <div className="footerLabel">Contact</div>
              <div className="footerValue">
                Email: <a href="mailto:csb@ajou.ac.kr">csb@ajou.ac.kr</a>
              </div>
            </div>
          </div>
        </div>
        <div className="footerBottom">&copy; {year} MSQ Lab. All rights reserved.</div>
      </div>
    </footer>
  );
}
