<?php
/**
 * Plugin Name: Multiple Content Sections
 * Plugin URI: http://linchpin.agency
 * Description: Add multiple content sections on a post by post basis.
 * Version: 1.4.1
 * Author: Linchpin
 * Author URI: http://linchpin.agency
 * License: GPLv2 or later
 *
 * @package MultipleContentSections
 */

// Make sure we don't expose any info if called directly.
if ( ! function_exists( 'add_action' ) ) {
	exit;
}

define( 'LINCHPIN_MCS_VERSION', '1.4.1' );
define( 'LINCHPIN_MCS_PLUGIN_NAME', 'Multiple Content Sections' );
define( 'LINCHPIN_MCS__MINIMUM_WP_VERSION', '4.0' );
define( 'LINCHPIN_MCS___PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'LINCHPIN_MCS___PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

include_once 'class.multiple-content-sections.php';

$multiple_content_sections = new Multiple_Content_Sections();

/**
 * @param null $type
 * @param int $depth
 * @param bool|false $search_parent
 *
 * @return array
 */
function mcs_get_files( $type = null, $depth = 0, $search_parent = false, $directory = '' ) {
	$files = (array) Multiple_Content_Sections::scandir( $directory, $type, $depth );

	if ( $search_parent && $this->parent() ) {
	    $files += (array) Multiple_Content_Sections::scandir( $directory, $type, $depth );
	}

    return $files;
}

/**
 * Load a list of template files.
 *
 * @access public
 *
 * @param string $section_templates (default: '') Our list of available templates.
 *
 * @return mixed
 */
function mcs_locate_template_files( $section_templates = '' ) {
	$current_theme = wp_get_theme();

	$section_templates = array();

	$plugin_template_files = (array) mcs_get_files( 'php', 1, false, LINCHPIN_MCS___PLUGIN_DIR . 'templates/' );

	// Loop through our local plugin templates.
	foreach( $plugin_template_files as $plugin_file => $plugin_file_full_path ) {
		if ( ! preg_match( '|MCS Template:(.*)$|mi', file_get_contents( $plugin_file_full_path ), $header ) ) {
			continue;
		}

		$section_templates[ $plugin_file ]['file'] = _cleanup_header_comment( $header[1] );

		if ( preg_match( '/MCS Template Blocks: ?([0-9]{1,2})$/mi', file_get_contents( $plugin_file_full_path ), $block_header ) ) {
			$section_templates[ $plugin_file ]['blocks'] = $block_header[1];
		}
	}

	$files = (array) $current_theme->get_files( 'php', 1 );

	// Loop through our theme templates. This should be made into utility method.
	foreach ( $files as $file => $full_path ) {

		if ( ! preg_match( '|MCS Template:(.*)$|mi', file_get_contents( $full_path ), $header ) ) {
			continue;
		}

		$section_templates[ $file ]['file'] = _cleanup_header_comment( $header[1] );

		if ( preg_match( '/MCS Template Blocks: ?([0-9]{1,2})$/mi', file_get_contents( $full_path ), $block_header ) ) {
			$section_templates[ $file ]['blocks'] = (int) $block_header[0];
		}
	}

	/**
	 * Filter list of page templates for a theme.
	 *
	 * This filter does not currently allow for page templates to be added.
	 *
	 * @since 1.3.5
	 *
	 * @param array        $page_templates Array of page templates. Keys are filenames,
	 *                                     values are translated names.
	 * @param WP_Theme     $this           The theme object.
	 * @param WP_Post|null $post           The post being edited, provided for context, or null.
	 */
	$return = apply_filters( 'mcs_section_templates', $section_templates );

	return $section_templates;
}

/**
 * Return admin facing markup for a section.
 *
 * @access public
 *
 * @param  object $section Current section being manipulated.
 * @param  bool|false $closed
 * @return void Prints the markup of the admin panel
 */
function mcs_add_section_admin_markup( $section, $closed = false ) {
	if ( ! is_admin() ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $section->ID ) ) {
		return;
	}

	$templates = mcs_locate_template_files();

	// Make sure we always have a template.
	if ( ! $selected_template = get_post_meta( $section->ID, '_mcs_template', true ) ) {
		$selected_template = 'mcs-columns-1.php';
	}

	$css_class     = get_post_meta( $section->ID, '_mcs_css_class', true );
	$offset        = get_post_meta( $section->ID, '_mcs_offset', true );
	$title_display = get_post_meta( $section->ID, '_mcs_title_display', true );
	$push_pull     = get_post_meta( $section->ID, '_mcs_push_pull', true );

	$featured_image_id = get_post_thumbnail_id( $section->ID );

	include LINCHPIN_MCS___PLUGIN_DIR . 'admin/section-container.php';
}

/**
 * @param $post_id
 * @param string $return_type
 *
 * @return array|WP_Query
 */
function mcs_get_sections( $post_id, $return_type = 'array' ) {
	$content_sections = new WP_Query( array(
		'post_type' => 'mcs_section',
		'posts_per_page' => 50,
		'orderby' => 'menu_order',
		'order' => 'ASC',
		'post_parent' => (int) $post_id,
	) );

	switch ( $return_type ) {
		case 'query' :
			return $content_sections;
			break;

		case 'array' :
		default      :
			return $content_sections->posts;
			break;
	}
}

/**
 * Load a specified template file for a section
 *
 * @access public
 *
 * @param string $post_id (default: '')
 *
 * @return void
 */
function the_mcs_content( $post_id = '' ) {

	global $post;

	if ( empty( $post_id ) ) {
		$post_id = $post->ID;
	}

	if ( 'mcs_section' !== get_post_type( $post_id ) ) {
		return;
	}

	if ( ! $template = get_post_meta( $post_id, '_mcs_template', true ) ) {
		$template = 'mcs-columns-1.php';
	}

	$located = locate_template( sanitize_text_field( $template ), true, false );

	if ( $located ) {
		return;
	} else {

		$file = LINCHPIN_MCS___PLUGIN_DIR . '/templates/' . $template;

		if ( file_exists( $file ) ) {
			include $file;
		} else {
			?>
			<div <?php post_class(); ?>>
				<h3 title="<?php the_title_attribute(); ?>"><?php the_title(); ?></h3>
				<div class="entry">
					<?php the_content(); ?>
				</div>
			</div>
			<?php
		}
	}
}

/**
 * mcs_display_sections function.
 *
 * @access public
 *
 * @param string $post_id (default: '')
 *
 * @return void
 */
function mcs_display_sections( $post_id = '' ) {
	global $post, $mcs_section_query;

	if ( empty( $post_id ) ) {
		$post_id = $post->ID;
	}

	if ( ! $mcs_section_query = mcs_get_sections( $post_id, 'query' ) ) {
		return;
	}

	if ( ! empty( $mcs_section_query ) ) {
		if ( $mcs_section_query->have_posts() ) {
			while ( $mcs_section_query->have_posts() ) {
				$mcs_section_query->the_post();
				the_mcs_content();
			}
		}
		wp_reset_postdata();
	}
}

/**
 * Get a section's blocks.
 *
 * @access public
 *
 * @param  int    $section_id
 * @param  string $post_status
 *
 * @return array
 */
function mcs_get_section_blocks( $section_id, $post_status = 'publish' ) {
	$content_blocks = new WP_Query( array(
		'post_type' => 'mcs_section',
		'post_status' => $post_status,
		'posts_per_page' => 50,
		'orderby' => 'menu_order',
		'order' => 'ASC',
		'post_parent' => (int) $section_id,
	) );

	if ( $content_blocks->have_posts() ) {
		return $content_blocks->posts;
	} else {
		return array();
	}
}

/**
 * Make sure a section has a certain number of blocks
 * @todo: Should always be at least 1 section?
 *
 * @access public
 *
 * @param  mixed $section
 * @param  int   $number_needed
 *
 * @return array
 */
function mcs_maybe_create_section_blocks( $section, $number_needed = 0 ) {

	$blocks = mcs_get_section_blocks( $section->ID, $section->post_status );
	$count = count( $blocks );

	// Create enough blocks to fill the section.
	while ( $count < $number_needed ) {
		wp_insert_post( array(
			'post_type'   => 'mcs_section',
			'post_title'  => 'Block ' . $count,
			'post_parent' => $section->ID,
			'menu_order'  => $count,
			'post_name'   => 'section-' . $section->ID . '-block',
		) );

		++$count;
	}

	return mcs_get_section_blocks( $section->ID, $section->post_status );
}

/**
 * Utility Method to add a sections background
 *
 * @param int $post_id
 * @param bool|true $echo
 */
function mcs_section_background( $post_id = 0, $echo = true ) {

	global $post;

	if ( empty( $post_id ) ) {
		$post_id  = $post->ID;
	}

	if ( has_post_thumbnail() ) {
		$image = wp_get_attachment_image_src( get_post_thumbnail_id( get_the_ID() ), 'full' );
		$style = 'data-interchange="[' . esc_url( $image[0] ) . ', (default)], [' . esc_url( $image[0] ) . ', (large)]" style="background-image: url(' . esc_url( $image[0] ) . ');"';
	}

	if ( empty( $style ) ) {
		return;
	} else {
		if ( false === $echo ) {
			return $style;
		} else {
			echo $style;
		}
	}
}

/**
 * Return an array of allowed html for wp_kses functions
 * @return mixed|void
 */
function mcs_get_allowed_html() {
	$mcs_allowed = apply_filters( 'mcs_default_allowed_html', array(
		'iframe' => array(
			'src' => true,
			'style' => true,
			'id' => true,
			'class' => true,
			'name' => true,
			'allowfullscreen' => true,
			'msallowfullscreen' => true,
			'mozallowfullscreen' => true,
			'webkitallowfullscreen' => true,
			'oallowfullscreen' => true,
			'allowtransparency' => true,
			'frameborder' => true,
			'scrolling' => true,
			'width' => true,
			'height' => true,
		),
		'script' => array(
			'src' => true,
		),
		'div' => array(
			'data-equalizer' => true,
			'data-equalizer-watch' => true,
		),
	) );

	$post_allowed = wp_kses_allowed_html( 'post' );

	return apply_filters( 'mcs_allowed_html', array_merge_recursive( $post_allowed, $mcs_allowed ) );
}