db = {};
db.session = new Meteor.Collection( 'session' );
db.gigs = new Meteor.Collection( 'gigs' );
db.gigstate = new Meteor.Collection( 'gigstate' );

pitch = {
	setContentHeight: function ( ) {
		var height = $( window ).height( );
		$( ".content" ).height( height - ( contentMargin * 3 ) );
	}
}

if ( Meteor.isClient ) {

	Handlebars.registerHelper( 'isActive', function ( data, options ) {
		if ( this.active === data ) {
			return options.fn( this );
		}
		return options.inverse( this );
	} );

	// set content margin, matches content margin in CSS
	var contentMargin = 10,
		setHeights = true;

	var pitch = {
		setContentHeight: function ( ) {
			if ( setHeights ) {
				var height = verge.viewportH( );
				$( ".content" ).height( height - ( contentMargin * 2 ) );
			}
		}
	};

	// Adjust columns according to breakpoints
	enquire.register( "screen and (max-width: 767px)", {
		match: function ( ) {
			Session.set( 'numColumns', 1 );
		}
	} )

	.register( "screen and (min-width: 768px) and (max-width: 1200px)", {
		match: function ( ) {
			Session.set( 'numColumns', 2 );
		}
	} )

	.register( "screen and (min-width: 1200px)", {
		match: function ( ) {
			Session.set( 'numColumns', 3 );
		}
	} );

	// Adjust content height on resize
	$( window ).resize( pitch.setContentHeight );

	// feed the gigs
	Template.gigs.rows = function ( ) {

		// fetch all the gigs, making sure an active state is set
		var gigs = _( db.gigs.find( {} ).fetch( ) ).map( function ( gig ) {

			// fetch matching state, but don't react to changes
			var gigstate = db.gigstate.findOne( gig.stateId, {
				reactive: false
			} );

			// decorate with active state
			return _( gig ).extend( {
				active: gigstate && gigstate.active || 'description',
				stateId: gigstate && gigstate._id
			} );
		} );

		// group gigs into rows
		return _( gigs ).chain( ).groupBy( function ( gig, i ) {
			return Math.floor( i / Session.get( 'numColumns' ) );
		} ).values( ).value( );

	};

	Template.gigRow.rendered = function ( ) {
		// set content heights
		pitch.setContentHeight( );

		// match height of headers across row
		var headers = this.findAll( 'h3' ),
			max = _( headers ).max( function ( el ) {
				return $( el ).height( );
			} ),
			height = $( max ).height( );

		_( headers ).each( function ( el ) {
			$( el ).height( height );
		} );

	}

	Template.gig.events( {
		'click .tech, tap .tech': function ( evt ) {
			evt.preventDefault( );
			db.gigstate.update( this.stateId, {
				$set: {
					active: 'tech'
				}
			} );
		},
		'click .lessons, tap .lessons': function ( evt ) {
			evt.preventDefault( );
			db.gigstate.update( this.stateId, {
				$set: {
					active: 'lessons'
				}
			} );
		},
		'click .description, tap .description': function ( evt ) {
			evt.preventDefault( );
			db.gigstate.update( this.stateId, {
				$set: {
					active: 'description'
				}
			} );
		}
	} );

	// set active panel for each item by reacting to changes
	Meteor.autorun( function ( ) {
		var gigstates = db.gigstate.find( {} );
		gigstates.observeChanges( {
			changed: function ( id, fields ) {
				var content = $( '[data-stateId="' + id + '"]' );

				// set active panel and tab
				content.find( '.panel.' + fields.active ).addClass( 'active' );
				content.find( '.controls span.' + fields.active ).addClass( 'selected' );

				// deactivate other panels and tabs
				content.find( '.panel' ).not( '.' + fields.active ).removeClass( 'active' );
				content.find( '.controls span' ).not( '.' + fields.active ).removeClass( 'selected' );
			}
		} )
	} );

}



if ( Meteor.isServer ) {

	Meteor.startup( function ( ) {

		// reset gigs
		db.gigs.remove( {} );
		db.gigstate.remove( {} );
		_( gigs ).each( function ( gig ) {

			// create default state record
			var stateId = db.gigstate.insert( {
				active: 'description'
			} );

			// create gig record, setting stateId
			db.gigs.insert( _( gig ).extend( {
				stateId: stateId
			} ) );
		} );

		// reset session
		db.session.remove( {} );
		db.session.insert( {
			name: 'default'
		} );

	} );
}
