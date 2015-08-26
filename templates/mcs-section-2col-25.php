<?php
/*
 * MCS Template: 2 Column 25
 */
?>



<section <?php post_class( 'mcs-section 2col-twentyfive' ) ?>>
  <div class="row">
    <div class="small-12 medium-3 columns">
        <h2 class="entry-title"><?php the_title(); ?></h2>
        <?php the_content(); ?>
    </div>
     <div class="small-12 medium-9 columns"> 
        <?php if ( has_post_thumbnail() ) : ?>
        <div class="small-only-text-center">
           <?php the_post_thumbnail(); ?>
        </div>
        <?php endif; ?>
        <div class="image-caption">
          <?php
          /* TODO: Set caption with image's title */
          ?>
        </div>
    </div>
  </div>
</section>