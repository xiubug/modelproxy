var assert = require( 'assert' );

var InterfaceManager = require( '../lib-cov/interfacemanager' );
var interfaceManager;

describe( 'InterfaceManager', function() {
  it( 'can not be initalized by error path', function() {
    assert.throws( function() {
      new InterfaceManager( 'error/path' );
    }, function( err ) {
      return err.toString()
          .indexOf( 'Fail to load interface profiles.Error' ) !== -1;
    } );

    interfaceManager = new InterfaceManager( '../tests/interface_test.json' ); 
    assert.equal( interfaceManager instanceof InterfaceManager, true );
  } );
  
  it( 'can not be initalized when no status is specified', function() {
    assert.throws( function() {
      new InterfaceManager({});
    }, function( err ) {
      return err.toString()
          .indexOf( 'There is no status specified' ) !== -1;
    } );
  } );

  it( 'should throw error if the interface configuration is not a json ', function() {
    assert.throws( function() {
      new InterfaceManager( '../tests/README.md' ); 
    }, function( err ) {
      return err.toString()
          .indexOf( 'syntax error' ) !== -1;
    } );
  } );
} );

describe( 'interfaceManager', function() {
  var ifmgr = new InterfaceManager( {
    status: 'online'
  } );

  describe( '#_addProfile()', function() {
    it( 'can not be added without id', function() {
      assert.equal( ifmgr._addProfile( {
        urls: {
          online: 'http://url1'
        }
      } ), false );
    } );

    it( 'can not be added when the interface id does not match ^((\\w+\\.)*\\w+)$', function() {
      assert.equal( ifmgr._addProfile( {
        id: 'Abc-methodName',
        urls: {
          online: 'http://url1'
        }
      } ), false );

      assert.equal( ifmgr._addProfile( {
        id: 'Abc.methodName.',
        urls: {
          online: 'http://url1'
        }
      } ), false );

      assert.equal( ifmgr._addProfile( {
        id: 'Abc.methodName',
        urls: {
          online: 'http://url1'
        }
      } ), true );
    } );

    it( 'can not add duplicated interface id', function() {
      assert.equal( ifmgr._addProfile( {
        id: 'Abc.methodName',
        urls: {
          online: 'htpp://url1'
        }
      } ), false );

      assert.equal( ifmgr._addProfile( {
        id: 'Abc.method1',
        urls: {
          online: 'htpp://url1'
        }
      } ), true );
    } );

    it( 'must have at least one url in urls or its rulefile is available', function() {
      ifmgr._rulebase = '.';

      assert.equal( ifmgr._addProfile( {
        id: 'Abc.method2',
        urls: {}
      } ), false );

      assert.equal( ifmgr._addProfile( {
        id: 'Abc.method2',
        ruleFile: 'unavailable.rule.json'
      } ), false );
    } );
  } );
  
  describe( '#getInterfaceIdsByPrefix()', function() {
    it( 'should have nothing matched when the prefix is not proper', function() {
      assert.equal( interfaceManager.getInterfaceIdsByPrefix( 'Prefix' ).length, 0 );
    } );
    it ( 'should return an array of interface when the prefix is right', function() {
      assert.notEqual( interfaceManager.getInterfaceIdsByPrefix( 'Search.' ).length, 0 );
    } );
  } );

  describe( '#isProfileExisted()', function() {
    it( 'should return false when the interface id does not exist', function() {
      assert.equal( interfaceManager.isProfileExisted( 'Search.getItem' ), false );
    } );
    it( 'should return true when the interface id exists', function() {
      assert.equal( interfaceManager.isProfileExisted( 'Search.getNav' ), true );
    } );
  } );

  describe( '#_isUrlsValid()', function() {
    it( 'should return false when the urls is null or an empty object', function() {
      assert.equal( interfaceManager._isUrlsValid( null ), false );
      assert.equal( interfaceManager._isUrlsValid( {} ), false );
    } );
    it( 'should return true when the urls is not null and has at least one url', function() {
      assert.equal( interfaceManager._isUrlsValid( { daily: 'http://url1' } ), true );
      assert.equal( interfaceManager._isUrlsValid( { daily: 'http://url1', online: 'http://url2' } ), true );
    } );
  } );

  describe( '#getProfile()', function() {
    it( 'should return undefined if the given id is not existed', function() {
       assert.strictEqual( interfaceManager.getProfile( 'Search.item' ), undefined );
    } );

    it( 'should renturn the profile if the given interface id is existed', function() {
      assert.equal( typeof interfaceManager.getProfile( 'Cart.getMyCart' ), 'object' );
    } );
  } );

  describe( '#getRule()', function() {
    it( 'should return rule of the given id', function() {
      assert.equal( typeof interfaceManager.getRule( 'Search.list' ), 'object' );
    } );

    it( 'should throw error when the rule file does not exist', function() {
      assert.throws( function() {
        interfaceManager.getRule( 'Test.post' );
      }, function( err ) {
        return err.toString()
          .indexOf( 'The rule file is not existed.' ) !== -1;         
      } );
    } );

    it( 'should throw error when the rule file is not a json', function() {
      assert.throws( function() {
        interfaceManager.getRule( 'Search.suggest' );
      }, function( err ) {
        return err.toString()
          .indexOf( 'Rule file has syntax error' ) !== -1;         
      } );
    } );

    it( 'should throw error when the interface id is not found', function() {
      assert.throws( function() {
        interfaceManager.getRule( 'Error.id' );
      }, function( err ) {
        return err.toString()
          .indexOf( 'is not found' ) !== -1;         
      } );
    } );
  } );

  describe( '#getEngine()', function() {
    it( 'should return mockjs', function() {
       assert.strictEqual( interfaceManager.getEngine(), 'mockjs' );
    } );
  } );

  describe( '#getStatus()', function() {
    it( 'should return online', function() {
      assert.strictEqual( interfaceManager.getStatus(), 'online' );
    } );
  } );

  it( 'clientInterfaces should be initalized after the object of interfaceManager is created', function() {
    var clientInterfaces = interfaceManager.getClientInterfaces();
    assert.notEqual( clientInterfaces, null );
    var cnt = 0;
    for ( var i in clientInterfaces ) cnt++;
    assert.equal( cnt, 7 );
  } );

} );