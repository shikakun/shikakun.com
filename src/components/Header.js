import React from 'react'
import { Link } from 'gatsby'

const Header = class extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <header className="header">
        <div className="content">
          <div className="header__brand">
            <Link to="/">
              shikakun
            </Link>
          </div>
        </div>
      </header>
    )
  }
}

export default Header
