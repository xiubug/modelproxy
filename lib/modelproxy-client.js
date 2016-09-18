KISSY.add( 'modelproxy', function ( S, IO ) {
    function Proxy( options ) {
        this._opt = options;
    }
    Proxy.prototype = {
        request: function( params, callback, errCallback ) {
            IO( {
                url: Proxy.base + '/' + this._opt.id,
                data: params,
                type: this._opt.method,
                dataType: this._opt.dataType,
                success: callback,
                error: errCallback
            } );
        },
        getOptions: function() {
            return this._opt;
        }
    };

    Proxy.objects = {};

    Proxy.create = function( id ) {
        if ( this.objects[ id ] ) {
            return this.objects[ id ];
        }
        var options = this._interfaces[ id ];
        if ( !options ) {
            throw new Error( 'No such interface id defined: '
                 + id + ', please check your interface configuration file' );
        }
        return this.objects[ id ] = new this( options );
    },

    Proxy.configBase = function( base ) {
        if ( this.base ) return;
        this.base = ( base || '' ).replace( /\/$/, '' );
        var self = this;
        // load interfaces definition.
        IO( {
            url: this.base + '/$interfaces',
            async: false,
            type: 'get',
            dataType: 'json',
            success: function( interfaces ) {
                self.config( interfaces );
            },
            error: function( err ) {
                throw err;
            }
        } );
    };

    Proxy.config = function( interfaces ) {
        this._interfaces = interfaces;
    };

    Proxy.getInterfaceIdsByPrefix = function( pattern ) {
        if ( !pattern ) return [];
        var ids = [], map = this._interfaces, len = pattern.length;
        for ( var id in map ) {
            if ( id.slice( 0, len ) == pattern ) {
                ids.push( id );
            }
        }
        return ids;
    };

    function ModelProxy( profile ) {
        if ( !profile ) return;

        if ( typeof profile === 'string' ) {
            if ( /^(\w+\.)+\*$/.test( profile ) ) {
                profile = Proxy
                    .getInterfaceIdsByPrefix( profile.replace( /\*$/, '' ) );

            } else {
                profile = [ profile ];
            }
        }
        if ( profile instanceof Array ) {
            var prof = {}, methodName;
            for ( var i = profile.length - 1; i >= 0; i-- ) {
                methodName = profile[ i ];
                methodName = methodName
                                .substring( methodName.lastIndexOf( '.' ) + 1 );
                if ( !prof[ methodName ] ) {
                    prof[ methodName ] = profile[ i ];

                } else {
                    methodName = profile[ i ].replace( /\./g, '_' );
                    prof[ methodName ] = profile[ i ]; 
                }
            }
            profile = prof;
        }
        
        for ( var method in profile ) {
            this[ method ] = ( function( methodName, interfaceId ) {
                var proxy = Proxy.create( interfaceId );
                return function( params ) {
                    params = params || {};
                    if ( !this._queue ) {
                        this._queue = [];
                    }
                    this._queue.push( {
                        params: params,
                        proxy: proxy
                    } );
                    return this;
                };
            } )( method, profile[ method ] );
        }
    }

    ModelProxy.prototype = {
        done: function( f, ef ) {
            if ( typeof f !== 'function' ) return;

            if ( !this._queue ) {
                f.apply( this );
                return;
            }
            this._sendRequestsParallel( this._queue, f, ef );

            this._queue = null;
            return this;
        },
        _sendRequestsParallel: function( queue, callback, errCallback ) {
            var args = [], self = this;

            var cnt = queue.length;

            for ( var i = 0; i < queue.length; i++ ) {
                ( function( reqObj, k ) {
                    reqObj.proxy.request( reqObj.params, function( data ) {
                        args[ k ] = data;
                        --cnt || callback.apply( self, args );
                    }, function( err ) {
                        errCallback = errCallback || self._errCallback;
                        if ( typeof errCallback === 'function' ) {
                            errCallback( err );

                        } else {
                            console.error( 'Error occured when sending request ='
                                , reqObj.proxy.getOptions(), '\nCaused by:\n', err );
                        }
                    } );
                } )( queue[i], i );
            }
        },
        error: function( f ) {
            this._errCallback = f;
        }
    };

    ModelProxy.create = function( profile ) {
        return new this( profile );
    };

    ModelProxy.configBase = function( path ) {
        Proxy.configBase( path );
    };
    
    return ModelProxy;

}, { requires: ['io'] } );