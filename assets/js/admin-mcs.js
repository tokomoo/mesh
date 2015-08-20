if( typeof(multiple_content_sections) == 'undefined' ) {
	multiple_content_sections = {};
}

multiple_content_sections.admin = function ( $ ) {

	var $doc                = $(document),
		$body		        = $('body'),
		$reorder_button     = $('.mcs-section-reorder'),
		$add_button         = $('.mcs-section-add'),
		$meta_box_container = $('#mcs-container'),
		$section_container  = $('#multiple-content-sections-container'),
		media_frames        = [];

	return {

		/**
		 * Initialize our script
		 */
		init : function() {
			$body
				.on('click', '.mcs-section-add', multiple_content_sections.admin.add_section )
				.on('click', '.mcs-section-remove', multiple_content_sections.admin.remove_section )
				.on('click', '.mcs-section-reorder', multiple_content_sections.admin.reorder_sections )
				.on('click', '.mcs-save-order', multiple_content_sections.admin.save_section_order )

				.on('change', '.mcs-choose-layout', multiple_content_sections.admin.choose_layout )

				.on('click', '.mcs-featured-image-choose', multiple_content_sections.admin.choose_background )
				.on('click.OpenMediaManager', '.mcs-featured-image-choose', multiple_content_sections.admin.choose_background )

				.on('keyup', '.mcs-section-title', multiple_content_sections.admin.change_section_title );

			var $sections = $( '.multiple-content-sections-section' );

			if ( $sections.length <= 1 ) {
				$reorder_button.addClass( 'disabled' );
			}
		},

		choose_layout : function( event ) {

			event.preventDefault();
			event.stopPropagation();

			var $this      = $(this),
				$spinner   = $this.siblings('.spinner'),
				$section   = $this.parents('.multiple-content-sections-section'),
				section_id = $section.attr('data-mcs-section-id');

			if ( $this.hasClass('disabled') ) {
				return false;
			}

			$spinner.addClass('is-active');

			$.post( ajaxurl, {
				action                  : 'mcs_choose_layout',
				mcs_post_id             : mcs_data.post_id,
				mcs_section_id          : section_id,
				mcs_section_layout      : $(this).val(),
				mcs_choose_layout_nonce : mcs_data.choose_layout_nonce
			}, function( response ) {
				if ( response ) {

					var $response = $( '<div />' ).html( response );

					$( '#mcs-sections-editor-' + section_id ).html('').append( $response );

					if( typeof tinymce.editors !== 'undefined' ) {

						if( tinymce.editors[ 'mcs-section-editor-' + section_id ] ) {
							tinymce.get('mcs-section-editor-' + section_id ).remove();
						}

						if( tinymce.editors[ 'mcs-section-editor-' + section_id + '-support' ] ) {
							tinymce.get('mcs-section-editor-' + section_id + '-support' ).remove();
						}
					}

					if( $('#mcs-section-editor-' + section_id ).length > 0 ) {
						tinymce.init({
							theme: "modern",
							skin: "lightgray",
							language: "en",
							formats: {
								alignleft: [{
									selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
									styles: {textAlign: "left"}
								}, {selector: "img,table,dl.wp-caption", classes: "alignleft"}],
								aligncenter: [{
									selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
									styles: {textAlign: "center"}
								}, {selector: "img,table,dl.wp-caption", classes: "aligncenter"}],
								alignright: [{
									selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
									styles: {textAlign: "right"}
								}, {selector: "img,table,dl.wp-caption", classes: "alignright"}],
								strikethrough: {inline: "del"}
							},
							relative_urls: false,
							remove_script_host: false,
							convert_urls: false,
							browser_spellcheck: true,
							fix_list_elements: true,
							entities: "38,amp,60,lt,62,gt",
							entity_encoding: "raw",
							keep_styles: false,
							cache_suffix: "wp-mce-4203-20150730",
							preview_styles: "font-family font-size font-weight font-style text-decoration text-transform",
							end_container_on_empty_block: true,
							wpeditimage_disable_captions: false,
							wpeditimage_html5_captions: true,
							plugins: "charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview",
							content_css: mcs_data.site_url + "/wp-includes/css/dashicons.css?ver=4.3," + mcs_data.site_url + "/wp-includes/js/tinymce/skins/wordpress/wp-content.css?ver=4.3,https://fonts.googleapis.com/css?family=Noto+Sans%3A400italic%2C700italic%2C400%2C700%7CNoto+Serif%3A400italic%2C700italic%2C400%2C700%7CInconsolata%3A400%2C700&subset=latin%2Clatin-ext," + mcs_data.site_url + "/wp-content/themes/twentyfifteen/css/editor-style.css," + mcs_data.site_url + "/wp-content/themes/twentyfifteen/genericons/genericons.css",
							resize: false,
							menubar: false,
							wpautop: true,
							indent: false,
							toolbar1: "bold,italic,bullist,numlist,blockquote,hr,alignleft,aligncenter,alignright,link,unlink,spellchecker",
							toolbar2: "",
							toolbar3: "",
							toolbar4: "",
							tabfocus_elements: "content-html,save-post",
							body_class: "content post-type-page post-status-publish locale-en-us",
							wp_autoresize_on: true,
							add_unload_trigger: false,
							selector: '#mcs-section-editor-' + section_id
						});
					}

					if( $('#mcs-section-editor-' + section_id + '-support' ).length > 0 ) {
						tinymce.init({
							theme: "modern",
							skin: "lightgray",
							language: "en",
							formats: {
								alignleft: [{
									selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
									styles: {textAlign: "left"}
								}, {selector: "img,table,dl.wp-caption", classes: "alignleft"}],
								aligncenter: [{
									selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
									styles: {textAlign: "center"}
								}, {selector: "img,table,dl.wp-caption", classes: "aligncenter"}],
								alignright: [{
									selector: "p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li",
									styles: {textAlign: "right"}
								}, {selector: "img,table,dl.wp-caption", classes: "alignright"}],
								strikethrough: {inline: "del"}
							},
							relative_urls: false,
							remove_script_host: false,
							convert_urls: false,
							browser_spellcheck: true,
							fix_list_elements: true,
							entities: "38,amp,60,lt,62,gt",
							entity_encoding: "raw",
							keep_styles: false,
							cache_suffix: "wp-mce-4203-20150730",
							preview_styles: "font-family font-size font-weight font-style text-decoration text-transform",
							end_container_on_empty_block: true,
							wpeditimage_disable_captions: false,
							wpeditimage_html5_captions: true,
							plugins: "charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview",
							content_css: mcs_data.site_url + "/wp-includes/css/dashicons.css?ver=4.3," + mcs_data.site_url + "/wp-includes/js/tinymce/skins/wordpress/wp-content.css?ver=4.3,https://fonts.googleapis.com/css?family=Noto+Sans%3A400italic%2C700italic%2C400%2C700%7CNoto+Serif%3A400italic%2C700italic%2C400%2C700%7CInconsolata%3A400%2C700&subset=latin%2Clatin-ext," + mcs_data.site_url + "/wp-content/themes/twentyfifteen/css/editor-style.css," + mcs_data.site_url + "/wp-content/themes/twentyfifteen/genericons/genericons.css",
							resize: false,
							menubar: false,
							wpautop: true,
							indent: false,
							toolbar1: "bold,italic,bullist,numlist,blockquote,hr,alignleft,aligncenter,alignright,link,unlink,spellchecker",
							toolbar2: "",
							toolbar3: "",
							toolbar4: "",
							tabfocus_elements: "content-html,save-post",
							body_class: "content post-type-page post-status-publish locale-en-us",
							wp_autoresize_on: false,
							add_unload_trigger: false,
							selector: '#mcs-section-editor-' + section_id + '-support'
						});
					}

					$spinner.removeClass('is-active');

				} else {
					$spinner.removeClass('is-active');
				}
			});

		},

		add_section : function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $this = $(this),
				$spinner = $this.siblings('.spinner');

			if ( $this.hasClass('disabled') ) {
				return false;
			}

			$spinner.addClass('is-active');

			$.post( ajaxurl, {
				action: 'mcs_add_section',
				mcs_post_id: mcs_data.post_id,
				mcs_add_section_nonce: mcs_data.add_section_nonce
			}, function(response){
				if ( response ) {
					var $response = $response_div = $( '<div />' ).html(response),
						$actual_response = $( '.multiple-content-sections-section', $response ),
						editor_id = '#mcs-section-editor-' + $actual_response.attr( 'data-mcs-section-id' ),
						$editor = $(editor_id, $response );

					$section_container.append( $actual_response );
					$spinner.removeClass('is-active');

					$postboxes = $('.multiple-content-sections-section', $meta_box_container);
					if ( $postboxes.length > 1 ) {
						$reorder_button.removeClass( 'disabled' );
					}

				} else {
					$spinner.removeClass('is-active');
				}
			});
		},

		remove_section : function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $this = $(this),
				$postbox = $this.parents('.multiple-content-sections-postbox'),
				$spinner = $('.mcs-add-spinner', $postbox),
				section_id = $postbox.attr( 'data-mcs-section-id' );

			$spinner.addClass('is-active');

			$.post( ajaxurl, {
				action: 'mcs_remove_section',
				mcs_post_id: mcs_data.post_id,
				mcs_section_id: section_id,
				mcs_remove_section_nonce: mcs_data.remove_section_nonce
			}, function(response){
				if ( '1' === response ) {
					$postbox.fadeOut( 400, function(){
						$postbox.remove();

						$postboxes = $('.multiple-content-sections-section', $meta_box_container);
						if ( $postboxes.length <= 1 ) {
							$reorder_button.addClass( 'disabled' );
						}
					});
				} else {
					$spinner.removeClass('is-active');
				}
			});
		},

		reorder_sections : function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $this = $(this),
				$reorder_spinner = $this.siblings('.spinner'),
				$sections = $( '.multiple-content-sections-postbox', $section_container )
				$block_click_span = $( '<span />' ).attr({
					'class' : 'mcs-block-click'
				});

			$add_button.addClass('disabled');
			$meta_box_container.addClass('mcs-is-ordering');

			$('.hndle', $meta_box_container ).each(function(){
				$(this).prepend( $block_click_span.clone() );
			});

			$('.mcs-block-click').on('click', multiple_content_sections.admin.block_click );

			$this.text('Save Order').addClass('mcs-save-order').removeClass('mcs-section-reorder');

			$sections.each(function(){
				$(this).addClass('closed');
			});

			$section_container.sortable({
				update: multiple_content_sections.admin.save_section_order_sortable
			});
		},

		save_section_order_sortable : function( event, ui ) {
			var $reorder_spinner = $('.mcs-reorder-spinner'),
				section_ids = [];

			$reorder_spinner.addClass( 'is-active' );

			$('.multiple-content-sections-postbox', $section_container).each(function(){
				section_ids.push( $(this).attr('data-mcs-section-id') );
			});

			response = multiple_content_sections.admin.save_section_ajax( section_ids, $reorder_spinner );
		},

		save_section_order : function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $this = $(this),
				$sections = $( '.multiple-content-sections-postbox', $section_container ),
				$reorder_spinner = $('.mcs-reorder-spinner'),
				section_ids = [];

			$reorder_spinner.addClass( 'is-active' );

			$add_button.removeClass('disabled');
			$this.text('Reorder').addClass('mcs-section-reorder').removeClass('mcs-save-order');

			$('.multiple-content-sections-postbox', $section_container).each(function(){
				section_ids.push( $(this).attr('data-mcs-section-id') );
			});

			$('.mcs-block-click').remove();

			multiple_content_sections.admin.save_section_ajax( section_ids, $reorder_spinner );

			$section_container.sortable('destroy');
		},

		save_section_ajax : function( section_ids, $current_spinner ) {
			$.post( ajaxurl, {
                'action': 'mcs_update_order',
                'mcs_post_id'    : mcs_data.post_id,
                'mcs_section_ids' : section_ids,
                'mcs_reorder_section_nonce' : mcs_data.reorder_section_nonce
            }, function( response ) {
				$current_spinner.removeClass( 'is-active' );
            });
		},

		change_section_title : function(event) {
			var $this = $(this),
				current_title = $this.val(),
				$postbox = $this.parents('.multiple-content-sections-postbox');

			if ( current_title === '' || current_title == 'undefined' ) {
				current_title = 'No Title';
			}

			$('h3.hndle', $postbox).html( current_title );
		},

		block_click : function(event){
			event.stopImmediatePropagation();
		},

		choose_background : function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $button = $(this),
				$section = $button.parents('.multiple-content-sections-postbox'),
				section_id = $section.attr('data-mcs-section-id'),
				frame_id = 'mcs-background-select-' + section_id,
				current_image = $button.attr('data-mcs-section-featured-image');

	        // If the frame already exists, re-open it.
	        if ( media_frames[ frame_id ] ) {
                media_frames[ frame_id ].uploader.uploader.param( 'mcs_upload', 'true' );
	            media_frames[ frame_id ].open();
	            return;
	        }

	        /**
	         * The media frame doesn't exist let, so let's create it with some options.
	         */
	        media_frames[ frame_id ] = wp.media.frames.media_frames = wp.media({
	            className: 'media-frame mcs-media-frame',
	            frame: 'select',
	            multiple: false,
	            title: 'Select Section Background',
	            button: {
	                text: 'Select Background'
	            }
	        });

            media_frames[ frame_id ].on('open', function(){
	            // Grab our attachment selection and construct a JSON representation of the model.
	            var selection = media_frames[ frame_id ].state().get('selection');

                selection.add( wp.media.attachment( current_image ) );
	        });

            media_frames[ frame_id ].on('select', function(){
	            // Grab our attachment selection and construct a JSON representation of the model.
	            var media_attachment = media_frames[ frame_id ].state().get('selection').first().toJSON(),
	            	$edit_icon = $( '<span />' ).attr({
		            	'class' : 'dashicons dashicons-edit'
		            });

				$.post( ajaxurl, {
	                'action': 'mcs_update_featured_image',
	                'mcs_section_id'  : section_id,
	                'mcs_image_id' : media_attachment.id,
	                'mcs_featured_image_nonce' : mcs_data.featured_image_nonce
	            }, function( response ) {
					if ( response != -1 ) {
						current_image = media_attachment.id;
						$button.text( media_attachment.title ).attr('data-mcs-section-featured-image', media_attachment.id ).append( $edit_icon );
					}
	            });
	        });

	        // Now that everything has been set, let's open up the frame.
	        media_frames[ frame_id ].open();
		}
	};
} ( jQuery );

jQuery(function( $ ) {
    multiple_content_sections.admin.init();
});