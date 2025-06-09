import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

// Ensure this endpoint is server-rendered to handle query parameters
export const prerender = false

export const GET: APIRoute = async ({ request }) => {
	try {
		// Get the limit from query params, default to 4
		const url = new URL(request.url)
		const limit = parseInt(url.searchParams.get('limit') || '4')

		// Get all blog posts
		const allPosts = await getCollection('blog')

		// Filter out draft posts and sort by publication date (newest first)
		const publishedPosts = allPosts
			.filter((post) => !post.data.draft)
			.sort((a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime())
			.slice(0, limit)

		// Transform to a clean, simple format
		const featuredPosts = publishedPosts.map((post) => {
			// Extract just the image path for thumbnail
			const thumbnailPath =
				typeof post.data.heroImage === 'string'
					? post.data.heroImage
					: post.data.heroImage?.src || ''

			return {
				title: post.data.title,
				thumbnail: thumbnailPath,
				url: `/blog/${post.slug}/`,
				description: post.data.description,
				publishedAt: post.data.pubDate
			}
		})

		return new Response(
			JSON.stringify({
				success: true,
				data: featuredPosts,
				count: featuredPosts.length,
				timestamp: new Date().toISOString()
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=300',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET',
					'Access-Control-Allow-Headers': 'Content-Type'
				}
			}
		)
	} catch (error) {
		console.error('API Error:', error)
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to fetch featured posts',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
