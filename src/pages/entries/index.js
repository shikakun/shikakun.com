import React from 'react'

import Layout from '../../components/Layout'
import Entries from '../../components/Entries'

export default class EntriesIndexPage extends React.Component {
  render() {
    return (
      <Layout>
        <div>
          <h1 className="title">
            Latest Stories
          </h1>
        </div>
        <section className="section">
          <div className="container">
            <div className="content">
              <Entries />
            </div>
          </div>
        </section>
      </Layout>
    )
  }
}
