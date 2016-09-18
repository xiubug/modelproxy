/** 
 * InterfaceManager
 * This Class is provided to parse the interface configuration file so that
 * the Proxy class can easily access the structure of the configuration.
 * @author ShanFan
 * @created 24-3-2014
 **/

var fs = require( 'fs' );

/**
 * InterfaceManager 
 * @param {String|Object} path The file path of inteface configuration or the interface object
 */
function InterfaceManager( path ) {
    this._path = path;

    // {Object} Interface Mapping, The key is interface id and 
    // the value is a json profile for this interface.
    this._interfaceMap = {};

    // {Object} A interface Mapping for client, the key is interface id and 
    // the value is a json profile for this interface.
    this._clientInterfaces = {};

    // {String} The path of rulebase where the interface rules is stored. This value will be override
    // if user specified the path of rulebase in interface.json.
    this._rulebase = typeof path === 'string' ? path.replace( /\/[^\/]*$/, '/interfaceRules' ) : '';

    typeof path === 'string'
        ? this._loadProfilesFromPath( path )
        : this._loadProfiles( path );
}

// InterfaceManager prototype
InterfaceManager.prototype = {

    // @throws errors
    _loadProfilesFromPath: function( path ) {
        console.info( 'Loading interface profiles.\nPath = ', path );

        try {
            var profiles = fs.readFileSync( path, { encoding: 'utf8' } );
        } catch ( e ) {
            throw new Error( 'Fail to load interface profiles.' + e );
        }
        try {
            profiles = JSON.parse( profiles );
        } catch( e ) {
            throw new Error( 'Interface profiles has syntax error:' + e );
        }
        this._loadProfiles( profiles );
    },
    
    _loadProfiles: function( profiles ) {
        if ( !profiles ) return;
        console.info( 'Title:', profiles.title, 'Version:', profiles.version );

        this._rulebase = profiles.rulebase 
                       ? ( profiles.rulebase || './' ).replace(/\/$/, '')
                       : this._rulebase;

        // {String} The mock engine name.
        this._engine = profiles.engine || 'mockjs';

        if ( profiles.status === undefined ) {
            throw new Error( 'There is no status specified in interface configuration!' );
        }

        // {String} The interface status in using. 
        this._status = profiles.status;

        var interfaces = profiles.interfaces || [];
        for ( var i = interfaces.length - 1; i >= 0; i-- ) {
            this._addProfile( interfaces[i] ) 
                && console.info( 'Interface[' + interfaces[i].id + '] is loaded.' );
        }
    },
    getProfile: function( interfaceId ) {
        return this._interfaceMap[ interfaceId ];
    },
    getClientInterfaces: function() {
        return this._clientInterfaces;
    },
    // @throws errors
    getRule: function( interfaceId ) {
        if ( !interfaceId || !this._interfaceMap[ interfaceId ] ) {
            throw new Error( 'The interface profile ' + interfaceId + " is not found." );
        }
        path = this._interfaceMap[ interfaceId ].ruleFile;
        if ( !fs.existsSync( path ) ) {
            throw new Error( 'The rule file is not existed.\npath = ' + path );
        }
        try {
            var rulefile = fs.readFileSync( path, { encoding: 'utf8' } );
        } catch ( e ) {
            throw new Error( 'Fail to read rulefile of path ' + path );
        }
        try {
            return JSON.parse( rulefile );
        } catch( e ) {
            throw new Error( 'Rule file has syntax error. ' + e + '\npath=' + path );
        }
    },
    getEngine: function() {
        return this._engine;
    },
    getStatus: function( name ) {
        return this._status;
    },
    // @return Array
    getInterfaceIdsByPrefix: function( pattern ) {
        if ( !pattern ) return [];
        var ids = [], map = this._interfaceMap, len = pattern.length;
        for ( var id in map ) {
            if ( id.slice( 0, len ) == pattern ) {
                ids.push( id );
            }
        }
        return ids;
    },

    isProfileExisted: function( interfaceId ) {
        return !!this._interfaceMap[ interfaceId ];
    },
    _addProfile: function( prof ) {
        if ( !prof || !prof.id ) {
            console.error( "Can not add interface profile without id!" );
            return false;
        }
        if ( !/^((\w+\.)*\w+)$/.test( prof.id ) ) {
            console.error( "Invalid id: " + prof.id );
            return false;
        }
        if ( this.isProfileExisted( prof.id ) ) {
            console.error( "Can not repeat to add interface [" + prof.id
                     + "]! Please check your interface configuration file!" );
            return false;
        }

        prof.ruleFile = this._rulebase + '/'
                         + ( prof.ruleFile || ( prof.id + ".rule.json" ) );

        if ( !this._isUrlsValid( prof.urls )
                && !fs.existsSync( prof.ruleFile ) ) {
            console.error( 'Profile is deprecated:\n', 
                prof, '\nNo urls is configured and No ruleFile is available' );
            return false;
        }
        if (!( prof.status in prof.urls || prof.status === 'mock'
                || prof.status === 'mockerr')) {
            prof.status = this._status;
        }

        prof.method         = { POST: 'POST', GET:'GET' }
                            [ (prof.method || 'GET').toUpperCase() ];
        prof.dataType       = { json: 'json', text: 'text', jsonp: 'jsonp' }
                            [ (prof.dataType || 'json').toLowerCase() ];
        prof.isRuleStatic   = !!prof.isRuleStatic || false;
        prof.isCookieNeeded = !!prof.isCookieNeeded || false;
        prof.signed         = !!prof.signed || false;
        prof.timeout        = prof.timeout || 10000;

        // prof.format
        // prof.filter         = ...
        this._interfaceMap[ prof.id ] = prof;

        this._clientInterfaces[ prof.id ] = {
            id: prof.id,
            method: prof.method,
            dataType: prof.dataType
        };

        return true;
    },
    _isUrlsValid: function( urls ) {
        if ( !urls ) return false;
        for ( var i in urls ) {
            return true;
        }
        return false;
    }
};

module.exports = InterfaceManager;