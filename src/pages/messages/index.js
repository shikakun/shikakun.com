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
                  <span class="form-control">
                    <label>name<input type="text" name="name" required /></label>
                  </span>
                  <span class="form-control">
                    <label>email<input type="email" name="email" required /></label>
                  </span>
                  <span class="form-control">
                    <label>message<textarea name="message" required></textarea></label>
                  </span>
                  <span class="form-control">
                    <button type="submit">send to @shikakun</button>
                  </span>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }
}
