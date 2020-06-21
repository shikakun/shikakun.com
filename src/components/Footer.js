import React from 'react'
import { Link } from 'gatsby'
import shikakun from '../../static/images/shikakun.jpg'

const Footer = class extends React.Component {
  render() {
    return (
      <footer className="footer">
        <div className="content">
          <div className="footer__content">
            <div className="footer__shikakun">
              <Link to="/">
                <img src={shikakun} alt="© shikakun" />
              </Link>
            </div>

            <nav
                className="footer__nav"
                role="navigation"
                aria-label="main-navigation"
              >
              <div className="nav">
                <ul className="nav__list">
                  <li className="nav__item">
                    <Link className="nav__link" to="/shikakun">
                      profile
                    </Link>
                  </li>
                  <li className="nav__item">
                    <Link className="nav__link" to="/messages">
                      direct message
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
      </footer>
    )
  }
}

export default Footer
