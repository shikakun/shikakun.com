import React from 'react'
import { Link } from 'gatsby'

const Header = class extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    if (window.location.pathname == '/') {
      return (
        <header className="header">
          <div className="content">
            <h1 className="header__brand">
              <Link to="/">
                shikakun
              </Link>
            </h1>
          </div>
        </header>
      )
    } else {
      return (
        <header className="header">
          <div className="content">
            <div className="header__brand">
              <Link to="/">
                shikakun.com
              </Link>
            </div>
          </div>
        </header>
      )
    }
  }
}

export default Header
