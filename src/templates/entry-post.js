import React from 'react'
import PropTypes from 'prop-types'
import { kebabCase } from 'lodash'
import { Helmet } from 'react-helmet'
import { graphql, Link } from 'gatsby'
import Layout from '../components/Layout'
import Content, { HTMLContent } from '../components/Content'
import SEO from '../components/SEO'

export const EntryPostTemplate = ({
  content,
  contentComponent,
  date,
  tags,
  title,
  helmet,
}) => {
  const PostContent = contentComponent || Content

  return (
    <article className="page">
      {helmet || ''}

      <div className="content">
        <header className="page__header">
          <h1 className="page__title">
            {title}
          </h1>

          <time className="page__date">
            {date}
          </time>
        </header>

        <div className="page__body">
          <div className="page__content">
            <PostContent content={content} />
          </div>
        </div>
      </div>
    </article>
  )
}

EntryPostTemplate.propTypes = {
  content: PropTypes.node.isRequired,
  contentComponent: PropTypes.func,
  description: PropTypes.string,
  title: PropTypes.string,
  helmet: PropTypes.object,
}

const EntryPost = ({ data }) => {
  const { markdownRemark: post } = data

  return (
    <Layout>
      <EntryPostTemplate
        content={post.html}
        contentComponent={HTMLContent}
        description={post.frontmatter.description}
        date={post.frontmatter.date}
        helmet={
          <SEO
            title={`${post.frontmatter.title} (${post.frontmatter.date})`}
            description={`${post.frontmatter.description}`}
            image={`${post.frontmatter.featuredimage.relativePath}`}
          />
        }
        tags={post.frontmatter.tags}
        title={post.frontmatter.title}
      />
    </Layout>
  )
}

EntryPost.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.object,
  }),
}

export default EntryPost

export const pageQuery = graphql`
  query EntryPostByID($id: String!) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      frontmatter {
        date(formatString: "YYYY")
        title
        description
        featuredimage {
          relativePath
        }
        tags
      }
    }
  }
`
