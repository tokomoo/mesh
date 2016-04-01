var multiple_content_sections = multiple_content_sections || {};

multiple_content_sections.blocks = function ( $ ) {

    var $body = $('body'),
        // Instance of our block controller
        self,
        admin;

    return {

        /**
         * Initialize out Blocks Administration
         */
        init : function() {

            self = multiple_content_sections.blocks;
            admin = multiple_content_sections.admin;

            $body
                .on('click', '.mcs-block-featured-image-trash', self.remove_background )
                .on('click', '.mcs-block-featured-image-choose', self.choose_background )
                .on('click.OpenMediaManager', '.mcs-block-featured-image-choose', self.choose_background )
                .on('click', '.msc-clean-edit:not(.title-input-visible)', self.show_field )
                .on('blur', '.msc-clean-edit-element', self.hide_field )
                .on('click', '.close-title-edit', self.hide_field )
                .on('click', '.slide-toggle-element', self.slide_toggle_element );

            self.setup_resize_slider();
            self.setup_drag_drop();
        },

        /**
         * Setup Block Drag and Drop
         *
         * @since 1.3.0
         */
        setup_drag_drop : function() {

            $( ".mcs-editor-blocks .block" ).draggable({
                'appendTo' : 'body',
                helper : function( event ) {

                    var $this = $(this),
                        _width = $this.width();
                        $clone = $this.clone().width(_width).css('background','#fff');
                        $clone.find('*').removeAttr('id');

                    return $clone;
                },
                revert: true,
                zIndex: 1000,
                handle: '.mcs-row-title',
                iframeFix:true,
                start:function( ui, event, helper ){}
            });

            $( ".block" )
                .addClass( "ui-widget ui-widget-content ui-helper-clearfix" )
                .find( ".block-header" )
                .addClass( "hndle ui-sortable-handle" )
                .prepend( "<span class='block-toggle' />");
            /*
             $( ".block-toggle" ).click(function() {
             var icon = $( this );
             icon.toggleClass( "ui-icon-minusthick ui-icon-plusthick" );
             icon.closest( ".block" ).find( ".block-content" ).toggle();
             }); */

            $( ".drop-target" ).droppable({
                accept: ".block:not(.ui-sortable-helper)",
                activeClass: "ui-state-hover",
                hoverClass: "ui-state-active",
                handle: ".block-header",
                revert: true,
                drop: function( event, ui ) {

                    var $this = $(this),
                        $swap_clone  = ui.draggable,
                        $swap_parent = ui.draggable.parent(),
                        $tgt         = $( event.target),
                        $tgt_clone   = $tgt.find('.block'),
                        $section     = $tgt.parents('.multiple-content-sections-section'),
                        section_id   = $section.attr('data-mcs-section-id');

                    $swap_clone.css( { 'top':'','left':'' } );

                    $this.append( $swap_clone );
                    $swap_parent.append( $tgt_clone );

                    self.reorder_blocks( $section.find('.wp-editor-area') );
                    self.save_order( section_id, event, ui );
                    self.setup_drag_drop();

                    return false;
                }
            });
        },

        /**
         * Change Block Widths based on Column Resizing
         *
         * @param event
         * @param ui
         */
        change_block_widths : function( event, ui ) {
            var $tgt          = $( event.target ),
                $columns      = $tgt.parent().parent().parent().find('.mcs-editor-blocks').find('.columns').addClass('dragging'),
                column_length = $columns.length,
                column_total  = 12,
                column_value  = ui.value,
                column_start  = column_value,
                max_width = 12,
                min_width = 3,
                slider_0 = 0,
                slider_1 = 0,
                column_values = [];

            // cap max column width

            if( column_length == 2 ) {

                max_width = 9;
                min_width = 3;

                column_value = Math.max( min_width, column_value );
                column_value = Math.min( max_width, column_value );

                column_values = [
                    column_value,
                    column_total - column_value
                ];
            } else if( column_length == 3 ) {

                if( typeof( ui.value ) != 'undefined' ) {
                    slider_0 = ( column_value && 2 > column_length ) ? column_value : ui.values[0];
                    slider_1 = ui.values[1];
                }

                max_width = 6;
                min_width = 3;

                column_values = [];

                column_value = Math.max(min_width, slider_0);
                column_value = Math.min(max_width, column_value);

                column_values[0] = column_value;

                min_width = slider_0 + 3;
                max_width = 9;

                column_value = Math.max(min_width, slider_1);
                column_value = Math.min(max_width, column_value);

                column_values[1] = column_value - column_values[0];
                column_values[2] = column_total - ( column_values[0] + column_values[1] );
            }

            // Custom class removal based on regex pattern
            $columns.removeClass (function (index, css) {
                return (css.match (/\mcs-columns-\d+/g) || []).join(' ');
            }).each( function( index ) {
                $(this).addClass( 'mcs-columns-' + column_values[ index ] );
            } );

        },

        /**
         * Save when a user adjust column widths still allow 12 columns min max
         * but cap the limits to 3 and 9 based on common usage.
         *
         * @todo: Add filters for column min, max
         *
         * @since 1.3.5
         *
         * @param event
         * @param ui
         */
        save_block_widths : function( event, ui ) {

            var $tgt          = $( event.target ),
                $columns      = $tgt.parent().parent().parent().find('.mcs-editor-blocks').find('.columns'),
                column_length = $columns.length,
                column_total  = 12,
                column_value  = $tgt.slider( "value" ),
                column_start  = column_value,
                post_data     = {
                    post_id : parseInt( mcs_data.post_id ),
                    section_id : parseInt( $tgt.closest('.multiple-content-sections-section').attr('data-mcs-section-id') ),
                    blocks : {}
                },
                max_width = 12,
                min_width = 3,
                slider_0 = ( column_value && 2 > column_length ) ? column_value : $tgt.slider( "values", 0 ),
                slider_1 = $tgt.slider( "values", 1 ),
                column_values = [];

            // Cap max column width
            if( column_length == 2 ) {

                max_width = 9;
                min_width = 3;

                column_value = Math.max( min_width, column_value );
                column_value = Math.min( max_width, column_value );

                // cap min column width
                if( column_value != $tgt.slider( "value" ) ) {
                    $tgt.slider( "value", column_value );
                }

                column_values = [
                    column_value,
                    column_total - column_value
                ];
            }

            if( column_length == 3 ) {

                max_width = 6;
                min_width = 3;

                column_values = [];

                column_value = Math.max( min_width, slider_0 );
                column_value = Math.min( max_width, column_value );

                column_values[0] = column_value;

                min_width = slider_0 + 3;
                max_width = 9;

                column_value = Math.max( min_width, slider_1 );
                column_value = Math.min( max_width, column_value );

                column_values[1] = column_value - column_values[0];

                column_values[2] = column_total - ( column_values[0] + column_values[1] );

                if( column_values[0] != $tgt.slider( 'option', "values" )[0] || column_value != $tgt.slider( 'option', "values")[1] ) {
                    $tgt.slider( "option", "values", [ column_value[0], column_value ]).refresh();
                    return;
                }
            }

            // Custom class removal based on regex pattern
            $columns.removeClass (function (index, css) {
                return (css.match (/\mcs-columns-\d+/g) || []).join(' ');
            });

            $columns.each( function( index ) {
                var $this = $(this),
                    block_id = parseInt( $this.find('.block').attr('data-mcs-block-id') ),
                    $column_input = $this.find('.column-width'),
                    $indicator    = $this.find( '.column-width-indicator' );

                $this.addClass( 'mcs-columns-' + column_values[ index ] );

                if( block_id && column_values[ index ] ) {
                    $column_input.val( column_values[ index ] );
                    $indicator.text( column_values[ index ] );
                    post_data.blocks[ block_id.toString() ] = column_values[ index ];
                }
            } );

            $.post( ajaxurl, {
                'action': 'mcs_update_block_widths',
                'mcs_post_data' : post_data,
                'mcs_reorder_blocks_nonce' : mcs_data.reorder_blocks_nonce
            }, function( response ) {
                // $current_spinner.removeClass( 'is-active' );
            });
        },

        /**
         *
         */
        setup_resize_slider : function() {
            $('.column-slider').addClass('ui-slider-horizontal').each(function() {

                var $this    = $(this),
                    blocks   = parseInt( $this.attr('data-mcs-blocks') ),
                    is_range = ( blocks > 2 ),
                    vals     = $.parseJSON( $this.attr('data-mcs-columns') ),
                    data     = {
                        range: is_range,
                        min:0,
                        max:12,
                        step:1,
                        start : function() {
                            $this.css('z-index', 1000);
                        },
                        stop : function() {
                            $this.css('z-index', '').find('.ui-slider-handle').css('z-index', 1000);
                        },
                        change : self.save_block_widths,
                        slide : self.change_block_widths
                    };

                if ( vals ) {
                    data.value = vals[0];
                }

                if( blocks === 3 ) {
                    vals[1] = vals[0] + vals[1]; // add the first 2 columns together
                    vals.pop();
                    data.values = vals;
                    data.value = null;
                }

                $this.slider( data );
            });
        },

        /**
         * Render Block after reorder or change.
         *
         * @since 1.3.5
         *
         * @param $tinymce_editors
         */
        reorder_blocks : function( $tinymce_editors ) {
            $tinymce_editors.each(function() {
                var editor_id   = $(this).prop('id'),
                    proto_id,
                    mce_options = [],
                    qt_options  = [];

                // Reset our editors if we have any
                if( typeof tinymce.editors !== 'undefined' ) {
                    if ( tinymce.editors[ editor_id ] ) {
                        tinymce.get( editor_id ).remove();
                    }
                }

                if ( typeof tinymce !== 'undefined' ) {

                    var $block_content = $(this).closest('.block-content');

                    /**
                     * Props to @danielbachuber for a shove in the right direction to have movable editors in the wp-admin
                     *
                     * https://github.com/alleyinteractive/wordpress-fieldmanager/blob/master/js/richtext.js#L58-L95
                     */

                    if (typeof tinyMCEPreInit.mceInit[ editor_id ] === 'undefined') {
                        proto_id = 'content';

                        // Clean up the proto id which appears in some of the wp_editor generated HTML
                        $block_content.html( $(this).closest('.block-content').html().replace(new RegExp(proto_id, 'g'), editor_id));

                        // This needs to be initialized, so we need to get the options from the proto
                        if (proto_id && typeof tinyMCEPreInit.mceInit[proto_id] !== 'undefined') {
                            mce_options = $.extend(true, {}, tinyMCEPreInit.mceInit[proto_id]);
                            mce_options.body_class = mce_options.body_class.replace(proto_id, editor_id );
                            mce_options.selector = mce_options.selector.replace(proto_id, editor_id );
                            mce_options.wp_skip_init = false;
                            tinyMCEPreInit.mceInit[editor_id] = mce_options;
                        } else {
                            // TODO: No data to work with, this should throw some sort of error
                            return;
                        }

                        if (proto_id && typeof tinyMCEPreInit.qtInit[proto_id] !== 'undefined') {
                            qt_options = $.extend(true, {}, tinyMCEPreInit.qtInit[proto_id]);
                            qt_options.id = qt_options.id.replace(proto_id, editor_id );

                            tinyMCEPreInit.qtInit[editor_id] = qt_options;

                            if ( typeof quicktags !== 'undefined' ) {
                                quicktags(tinyMCEPreInit.qtInit[editor_id]);
                            }
                        }
                    }

                    // @todo This is kinda hacky. See about switching this out @aware
                    $block_content.find('.switch-tmce').trigger('click');
                }
            });
        },

        /**
         * Save the order of our blocks after drag and drop reorde
         *
         * @param section_id
         * @param event
         * @param ui
         */
        save_order : function( section_id, event, ui ) {

            var $reorder_spinner = $('.mcs-reorder-spinner'),
                block_ids = [];

            $( '#mcs-sections-editor-' + section_id ).find( '.block' ).each( function() {
                block_ids.push( $(this).attr('data-mcs-block-id') );
            });

            var response = self.save_ajax( section_id, block_ids, $reorder_spinner );
        },

        /**
         * Save when we reorder our blocks within a section
         *
         * @since 1.3.5
         *
         * @param section_id
         * @param block_ids
         * @param $reorder_spinner
         */
        save_ajax : function( section_id, block_ids, $reorder_spinner ) {

            $.post( ajaxurl, {
                'action': 'mcs_update_block_order',
                'mcs_section_id'    : section_id,
                'mcs_blocks_ids' : block_ids,
                'mcs_reorder_blocks_nonce' : mcs_data.reorder_blocks_nonce
            }, function( response ) {
                // $current_spinner.removeClass( 'is-active' );
            });
        },

        /**
         * Choose a background for our block
         *
         * @param event
         */
        choose_background : function(event) {
            event.preventDefault();
            event.stopPropagation();

            var $button       = $(this),
                $section      = $button.parents('.block'),
                section_id    = parseInt( $section.attr('data-mcs-block-id') ),
                frame_id      = 'mcs-background-select-' + section_id,
                current_image = $button.attr('data-mcs-block-featured-image');

            admin.media_frames = admin.media_frames || [];

            // If the frame already exists, re-open it.
            if ( admin.media_frames[ frame_id ] ) {
                admin.media_frames[ frame_id ].uploader.uploader.param( 'mcs_upload', 'true' );
                admin.media_frames[ frame_id ].open();
                return;
            }

            /**
             * The media frame doesn't exist let, so let's create it with some options.
             */
            admin.media_frames[ frame_id ] = wp.media.frames.media_frames = wp.media({
                className: 'media-frame mcs-media-frame',
                frame: 'select',
                multiple: false,
                title: mcs_data.strings.select_block_bg,
                button: {
                    text: mcs_data.strings.select_bg
                }
            });

            admin.media_frames[ frame_id ].on('open', function(){
                // Grab our attachment selection and construct a JSON representation of the model.
                var selection = admin.media_frames[ frame_id ].state().get('selection');

                selection.add( wp.media.attachment( current_image ) );
            });

            admin.media_frames[ frame_id ].on('select', function(){
                // Grab our attachment selection and construct a JSON representation of the model.
                var media_attachment = admin.media_frames[ frame_id ].state().get('selection').first().toJSON(),
                    $edit_icon = $( '<span />', {
                        'class' : 'dashicons dashicons-edit'
                    }),
                    $trash_icon = $( '<span />', {
                        'class' : 'dashicons dashicons-trash'
                    }),
                    $trash = $('<button/>', {
                        'type' : 'button',
                        'data-mcs-section-featured-image': '',
                        'href' : '#',
                        'class' : 'mcs-featured-image-trash'
                    }).text( mcs_data.strings.remove_image).prepend( $trash_icon );

                $.post( ajaxurl, {
                    'action': 'mcs_update_featured_image',
                    'mcs_section_id'  : parseInt( section_id ),
                    'mcs_image_id' : parseInt( media_attachment.id ),
                    'mcs_featured_image_nonce' : mcs_data.featured_image_nonce
                }, function( response ) {
                    if ( response != -1 ) {
                        current_image = media_attachment.id;
                        $button
                            .text( media_attachment.title )
                            .attr('data-mcs-section-featured-image', parseInt( media_attachment.id ) )
                            .append( $edit_icon )
                            .after( $trash );
                    }
                });
            });

            // Now that everything has been set, let's open up the frame.
            admin.media_frames[ frame_id ].open();
        },

        /**
         * Remove selected background from our block
         *
         * @since 1.3.6
         *
         * @param event
         */
        remove_background : function( event ) {

            event.preventDefault();
            event.stopPropagation();

            var $button       = $(this),
                $section      = $button.parents('.block'),
                section_id    = parseInt( $section.attr('data-mcs-block-id') ),
                $edit_icon    = $( '<span class="dashicons dashicons-format-image" />' );

            $.post( ajaxurl, {
                'action': 'mcs_update_featured_image',
                'mcs_section_id'  : parseInt( section_id ),
                'mcs_featured_image_nonce' : mcs_data.featured_image_nonce
            }, function( response ) {
                if ( response != -1 ) {
                    $button.prev().text( mcs_data.strings.add_image ).prepend( $edit_icon );
                    $button.remove();
                }
            });
        },

        show_field : function ( event ) {
	        event.preventDefault();
	        event.stopPropagation();

	        $(this).addClass('title-input-visible');
		},

		hide_field : function ( event ) {
	        event.preventDefault();
	        event.stopPropagation();

	        $('.title-input-visible').removeClass('title-input-visible');
		},

		slide_toggle_element : function ( event ) {
			event.preventDefault();
			event.stopPropagation();

			var $this   = $(this),
				$toggle = $this.data('toggle');

			$($toggle).slideToggle('fast');
		}
    };

} ( jQuery );
;
if( typeof(multiple_content_sections) == 'undefined' ) {
	multiple_content_sections = {};
}

multiple_content_sections.admin = function ( $ ) {

	var $body		        = $('body'),
		$reorder_button     = $('.mcs-section-reorder'),
		$add_button         = $('.mcs-section-add'),
		$expand_button      = $('.mcs-section-expand'),
		$meta_box_container = $('#mcs-container'),
		$section_container  = $('#multiple-content-sections-container'),
		$description        = $('#mcs-description'),
		$empty_message      = $('.empty-sections-message'),
		media_frames        = [],

		// Container References for Admin(self) / Block
		self,
		blocks;

	return {

		/**
		 * Initialize our script
		 */
		init : function() {

			self = multiple_content_sections.admin;
			blocks = multiple_content_sections.blocks;

			$body
				.on('click', '.mcs-section-add', self.add_section )
				.on('click', '.mcs-section-remove', self.remove_section )
				.on('click', '.mcs-section-reorder', self.reorder_sections )
				.on('click', '.mcs-save-order', self.save_section_order )

				.on('change', '.mcs-choose-layout', self.choose_layout )

				.on('click', '.mcs-featured-image-choose', self.choose_background )
				.on('click.OpenMediaManager', '.mcs-featured-image-choose', self.choose_background )

				.on('click', '.mcs-featured-image-trash', self.remove_background )

				.on('click', '.mcs-section-expand', self.expand_all_sections )

				.on('keydown', '.msc-clean-edit-element', self.change_input_title )

				.on('change', 'select.msc-clean-edit-element', self.change_select_title );

			var $sections = $( '.multiple-content-sections-section' );

			if ( $sections.length <= 1 ) {
				$reorder_button.addClass( 'disabled' );
			}

			// Setup our controls for Blocks
			blocks.init();

			self.setup_notifications( $meta_box_container );

		},

		/**
		 * Add notifications to our section
		 *
		 * @param $layout
		 */
		setup_notifications : function( $layout ) {
			// Make notices dismissible
			$layout.find( '.notice.is-dismissible' ).each( function() {
				var $this = $( this ),
					$button = $( '<button type="button" class="notice-dismiss"><span class="screen-reader-text"></span></button>' ),
					btnText = commonL10n.dismiss || '';

				// Ensure plain text
				$button.find( '.screen-reader-text' ).text( btnText );

				$this.append( $button );

				$button.on( 'click.wp-dismiss-notice', function( event ) {
					event.preventDefault();

					$.post( ajaxurl, {
						action                : 'mcs_dismiss_notification',
						mcs_notification_type : $this.attr('data-type'),
						_wpnonce     : mcs_data.dismiss_nonce
					}, function( response ) {});

					$this.fadeTo( 100 , 0, function() {
						$(this).slideUp( 100, function() {
							$(this).remove();
						});
					});
				});
			});
		},

		/**
		 * 1 click to expand or collapse sections
		 *
		 * @since 1.3.0
		 *
		 * @param event
		 */
		expand_all_sections : function( event ) {

			event.preventDefault();
			event.stopPropagation();

			var $this = $(this);

			$this.toggleClass('expanded');

			if( ! $this.hasClass('expanded') ) {
				$this.text( mcs_data.strings.expand_all );
			} else {
				$this.text( mcs_data.strings.collapse_all );
			}

			$('#multiple-content-sections-container').find('.hndle').trigger('click');
		},

		/**
		 * Choose what layout is used for the section
		 *
		 * @since 1.1.0
		 *
		 * @param event
		 * @returns {boolean}
		 */
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

					var $response        = $( response ),
						$tinymce_editors = $response.find('.wp-editor-area'),
						$layout          = $( '#mcs-sections-editor-' + section_id );

					$layout.html('').append( $response );

					// Loop through all of our edits in the response

					blocks.reorder_blocks( $tinymce_editors );
					blocks.setup_resize_slider();
					blocks.setup_drag_drop();

					self.setup_notifications( $layout );

					$spinner.removeClass('is-active');

				} else {
					$spinner.removeClass('is-active');
				}
			});
		},

		/**
		 * Add a new section to our content
		 *
		 * @since 1.0.0
		 *
		 * @param event
		 * @returns {boolean}
		 */
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
			}, function( response ){
				if ( response ) {
					var $response        = $( response ),
						$tinymce_editors = $response.find('.wp-editor-area' );

					$section_container.append( $response );
					$spinner.removeClass('is-active');

					if ( $('.empty-sections-message').length ) {
						$('.empty-sections-message').fadeOut('fast');
					}

					var $postboxes = $('.multiple-content-sections-section', $meta_box_container );

					if ( $postboxes.length > 1 ) {
						$reorder_button.removeClass( 'disabled' );
					}

					blocks.reorder_blocks( $tinymce_editors );

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

						var $postboxes = $('.multiple-content-sections-section', $meta_box_container);

						if ( $postboxes.length <= 1 ) {
							$reorder_button.addClass( 'disabled' );
						}
					});
				} else {
					$spinner.removeClass('is-active');
				}
			});
		},

		/**
		 * Save when sections are reordered
		 *
		 * @since 1.0
		 *
		 * @param event
		 */
		reorder_sections : function( event ) {
			event.preventDefault();
			event.stopPropagation();

			var $this = $(this),
				$reorder_spinner = $this.siblings('.spinner'),
				$sections = $( '.multiple-content-sections-postbox', $section_container),
				$block_click_span = $( '<span class="mcs-block-click">' );

			$expand_button.addClass('disabled');
			$add_button.addClass('disabled');
			$meta_box_container.addClass('mcs-is-ordering');

			self.update_notifications( 'reorder', 'warning' );

			$('.hndle', $meta_box_container ).each(function(){
				$(this).prepend( $block_click_span.clone() );
			});

			$('.mcs-block-click').on('click', self.block_click );

			$this.text('Save Order').addClass('mcs-save-order button-primary').removeClass('mcs-section-reorder');

			$sections.each(function(){
				$(this).addClass('closed');
			});

			$section_container.sortable({
				update : self.save_section_order_sortable
			});
		},

		/**
		 * Utility method to display notification information
		 *
		 * @since 1.3.0
		 *
		 * @param string message The message to display
		 * @param string type The type of message to display (warning|info|success)
		 */
		update_notifications : function( message, type ) {

			$description
				.removeClass('notice-info notice-warning notice-success')
				.addClass('notice-' + type )
				.find('p')
				.text( mcs_data.strings[ message ] );

			if( ! $description.is(':visible') ) {
				$description.css({'opacity' : 0 }).show();
			}

			$description.fadeIn('fast');
		},

		save_section_order_sortable : function( event, ui ) {
			var $reorder_spinner = $('.mcs-reorder-spinner'),
				section_ids = [];

			$reorder_spinner.addClass( 'is-active' );

			$('.multiple-content-sections-postbox', $section_container).each(function(){
				section_ids.push( $(this).attr('data-mcs-section-id') );
			});

			response = self.save_section_ajax( section_ids, $reorder_spinner );
		},

		save_section_order : function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $this = $(this),
				$sections = $( '.multiple-content-sections-postbox', $section_container ),
				$reorder_spinner = $('.mcs-reorder-spinner'),
				section_ids = [];

			$reorder_spinner.addClass( 'is-active' );

			$expand_button.removeClass('disabled');
			$add_button.removeClass('disabled');
			$this.text('Reorder').addClass('mcs-section-reorder').removeClass('mcs-save-order button-primary');

			$('.multiple-content-sections-postbox', $section_container).each(function(){
				section_ids.push( $(this).attr('data-mcs-section-id') );
			});

			$('.mcs-block-click').remove();

			if( $description.is(':visible') ) {
				$description.removeClass('notice-warning').addClass('notice-info').find('p').text( mcs_data.strings.description );
			}

			self.save_section_ajax( section_ids, $reorder_spinner );

			$section_container.sortable('destroy');
		},

		save_section_ajax : function( section_ids, $current_spinner ) {
			$.post( ajaxurl, {
                'action': 'mcs_update_order',
                'mcs_post_id'    : parseInt( mcs_data.post_id ),
                'mcs_section_ids' : section_ids,
                'mcs_reorder_section_nonce' : mcs_data.reorder_section_nonce
            }, function( response ) {
				$current_spinner.removeClass( 'is-active' );
            });
		},

		change_input_title : function(event) {
			var $this = $(this),
				current_title = $this.val(),
				$handle_title = $this.siblings('.handle-title');

			self.prevent_submit( event, $this );

			if ( $this.is('select') ) {
				return;
			}

			if ( current_title === '' || current_title == 'undefined' ) {
				current_title = mcs_data.strings.default_title;
			}

			$handle_title.text( current_title );
		},

		change_select_title : function( event ) {
			var $this = $(this),
				current_title = $this.val(),
				$handle_title = $this.sibling('.handle-title');

			switch ( current_title ) {
				case 'publish':
					current_title = mcs_data.strings.published;
					break;

				case 'draft':
					current_title = mcs.strings.draft;
			}

			$handle_title.text( current_title );
		},

		/**
		 * Prevent submitting the post/page when hitting enter
		 * while focused on a section or block form element
		 *
		 * @since 1.0.0
		 *
		 * @param event
		 */
		prevent_submit : function( event, $this ) {
			if ( 13 == event.keyCode ) {
				$this.siblings('.close-title-edit').trigger('click');

				event.preventDefault();

				return false;
			}
		},

		/**
		 * Block our click event while reordering
		 *
		 * @since 1.0.0
		 *
		 * @param event
		 */
		block_click : function(event){
			event.stopImmediatePropagation();
		},

		/**
		 * Remove our selected background
		 *
		 * @since 1.3.6
		 *
		 * @param event
		 */
		remove_background : function(event) {

			event.preventDefault();
			event.stopPropagation();

			var $button       = $(this),
				$section      = $button.parents('.multiple-content-sections-postbox'),
				section_id    = parseInt( $section.attr('data-mcs-section-id') ),
				current_image = $button.attr('data-mcs-section-featured-image'),
				$edit_icon = $( '<span class="dashicons dashicons-format-image" />');

			$.post( ajaxurl, {
				'action': 'mcs_update_featured_image',
				'mcs_section_id'  : parseInt( section_id ),
				'mcs_featured_image_nonce' : mcs_data.featured_image_nonce
			}, function( response ) {
				if ( response != -1 ) {
					if ( $button.prev().hasClass('right') && ! $button.prev().hasClass('button') ) {
						$button.prev().toggleClass( 'button right' );
					}

					$button.prev().text( mcs_data.strings.add_image );

					$button.remove();
				}
			});
		},

		choose_background : function(event) {
			event.preventDefault();
			event.stopPropagation();

			var $button       = $(this),
				$section      = $button.parents('.multiple-content-sections-postbox'),
				section_id    = parseInt( $section.attr('data-mcs-section-id') ),
				frame_id      = 'mcs-background-select-' + section_id,
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
	            title: mcs_data.strings.select_section_bg,
	            button: {
	                text: mcs_data.strings.select_bg
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
	            	$edit_icon = $( '<span />', {
						'class' : 'dashicons dashicons-edit'
					}),
					$trash = $('<a/>', {
						'data-mcs-section-featured-image': '',
						'href' : '#',
						'class' : 'mcs-featured-image-trash dashicons-before dashicons-dismiss'
					});

				$.post( ajaxurl, {
	                'action': 'mcs_update_featured_image',
	                'mcs_section_id'  : parseInt( section_id ),
	                'mcs_image_id' : parseInt( media_attachment.id ),
	                'mcs_featured_image_nonce' : mcs_data.featured_image_nonce
	            }, function( response ) {
					if ( response != -1 ) {
						current_image = media_attachment.id;
						$button
							.html( '<img src="' + media_attachment.url + '" />' )
							.attr('data-mcs-section-featured-image', parseInt( media_attachment.id ) )
							.after( $trash );

						if ( $button.hasClass('button') && ! $button.hasClass('right') ) {
							$button.toggleClass( 'button right' );
						}
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
//# sourceMappingURL=admin-mcs.js.map