import React from 'react'
import Layout from '../../components/Layout'

export default class Index extends React.Component {
  render() {
    return (
      <Layout>
        <div className="page">
          <div className="content">
            <div className="page__body">
              <div className="page__content">
                <form name="direct-messages" method="post" action="https://direct-message-to-shikakun.netlify.app/">
                  <input type="hidden" name="form-name" value="direct-messages" />
                  <div>
                    <label>Name: <input type="text" name="name" required /></label>
                  </div>
                  <div>
                    <label>Email: <input type="email" name="email" required /></label>
                  </div>
                  <div>
                    <label>Message: <textarea name="message" required></textarea></label>
                  </div>
                  <div>
                    <button type="submit">Send</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }
}
