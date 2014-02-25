Meteor.startup( function () {

	var objectiveId;

	// reset gigs
	Meteor.db.gigs.remove( {} );
	Meteor.db.states.remove( {} );
	_( gigs ).each( function ( gig ) {

		// create default state record
		var stateId = Meteor.db.states.insert( {
			active: 'description'
		} );

		// create gig record, setting stateId
		Meteor.db.gigs.insert( _( gig ).extend( {
			stateId: stateId
		} ) );
	} );

	// reset education
	Meteor.db.education.remove( {} );
	_( education ).each( function ( edu ) {
		Meteor.db.education.insert( edu );
	} );

	// reset objective
	Meteor.db.objective.remove( {} );
	objectiveId = Meteor.db.objective.insert( objective );

	// reset session
	Meteor.db.session.remove( {} );
	Meteor.db.session.insert( {
		key: 'default',
		active: {
			collection: 'objective',
			id: objectiveId
		}
	} );

	// publish records
	Meteor.publish( 'gigs', function () {
		return Meteor.db.gigs.find( {} );
	} );

	Meteor.publish( 'projects', function () {
		return Meteor.db.projects.find( {} );
	} );

	Meteor.publish( 'states', function () {
		return Meteor.db.states.find( {} );
	} );

	Meteor.publish( 'education', function () {
		return Meteor.db.education.find( {} );
	} );

	Meteor.publish( 'objective', function () {
		return Meteor.db.objective.find( {
			key: 'default'
		} );
	} )

	Meteor.publish( 'userData', function ( config ) {
		return Meteor.users.find( {
			_id: {
				$in: config.clients
			}
		} );
	} );

	Meteor.publish( 'session', function ( key ) {
		return Meteor.db.session.find( {
			key: key
		} );
	} );



	// broadcast disconnects
	var clients = [];
	Meteor.streams.presence.on( 'ping', function () {

		var userId = this.userId,
			now = new Date().getTime(),
			match = _( clients ).find( function ( client ) {
				return client[ 0 ] === userId;
			} );

		if ( match ) {
			match[ 1 ] = now;

		} else {
			clients.push( [ userId, now ] );
			Meteor.streams.presence.emit( 'add', {
				added: userId,
				clients: _( clients ).map( function ( client ) {
					return client[ 0 ];
				} )
			} );

			// Getting inconsistant results with onDisconnect, disabling for now

			// this.onDisconnect = function ( message ) {
			// 	console.log( 'disconnect client ' + userId );
			// 	clients = _( clients ).chain( ).map( function ( client ) {
			// 		return client[ 0 ] === userId ? client : false;
			// 	} ).compact( ).value( );
			// 	Meteor.streams.presence.emit( 'disconnect', {
			// 		removed: userId
			// 	} );
			// };
		}

	} );

	// define cleanup interval to expire connections that have dropped
	Meteor.setInterval( function () {
		var now = new Date().getTime();

		clients = _( clients ).chain().map( function ( client ) {
			//console.log( 'cleanup client ' + client );
			if ( client[ 1 ] < now - Meteor.pitch.pingInterval * Meteor.pitch.numFailedPingsAllowed ) {
				//console.log( 'drop ' + client[ 0 ] );
				Meteor.streams.presence.emit( 'drop', {
					removed: client[ 0 ]
				} );
				return;
			}
			return client;

		} ).compact().value();

	}, Meteor.pitch.pingInterval * Meteor.pitch.cleanupCoefficient );

	// define methods
	Meteor.methods( {
		getConnected: function () {
			return _( clients ).map( function ( client ) {
				return client[ 0 ];
			} );
		}
	} );

} );
