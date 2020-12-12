import React from 'react'
import PropTypes from 'prop-types'
import { Link, graphql, StaticQuery } from 'gatsby'
import PreviewCompatibleImage from './PreviewCompatibleImage'

class Entries extends React.Component {
  render() {
    const { data } = this.props
    const { edges: posts } = data.allMarkdownRemark

    return (
      <div className="entry-list">
        {posts && posts.map(({ node: post }) => (
          post.frontmatter.hidden ? null : (
            <div className="entry-item" key={post.id}>
              <div
                className={`entry ${
                  post.frontmatter.featuredpost ? 'is-featured' : ''
                }`}
              >
                <Link
                  className="entry__link"
                  to={post.fields.slug}
                >
                  {post.frontmatter.featuredimage ? (
                    <div className="entry__media">
                      <PreviewCompatibleImage
                        imageInfo={{
                          image: post.frontmatter.featuredimage,
                          alt: `featured image thumbnail for post ${post.frontmatter.title}`,
                        }}
                      />
                    </div>
                  ) : null}

                  <div className="entry__body">
                    <div className="entry__title">
                      {post.frontmatter.title}
                    </div>

                    <time className="entry__date">
                      {post.frontmatter.date}
                    </time>
                  </div>
                </Link>
              </div>
            </div>
          )
        ))}
      </div>
    )
  }
}

Entries.propTypes = {
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      edges: PropTypes.array,
    }),
  }),
}

export default () => (
  <StaticQuery
    query={graphql`
      query EntriesQuery {
        allMarkdownRemark(
          sort: { order: DESC, fields: [frontmatter___date] }
          filter: { frontmatter: { templateKey: { eq: "entry-post" } } }
        ) {
          edges {
            node {
              excerpt(pruneLength: 400)
              id
              fields {
                slug
              }
              frontmatter {
                title
                templateKey
                date(formatString: "YYYY")
                featuredpost
                featuredimage {
                  childImageSharp {
                    fluid(maxWidth: 1920, maxHeight: 1080, quality: 100) {
                      ...GatsbyImageSharpFluid
                    }
                  }
                }
                hidden
              }
            }
          }
        }
      }
    `}
    render={(data, count) => <Entries data={data} count={count} />}
  />
)
