import FileServiceAdapter from '../luna/FileServiceAdapter';
import HttpProxyServiceAdapter from '../luna/HttpProxyServiceAdapter';
import LunaServiceAdapter from '../luna/LunaServiceAdapter';
import MockFileServiceAdapter from '../mock/MockFileServiceAdapter';
import MockHttpProxyServiceAdapter from '../mock/MockHttpProxyServiceAdapter';
import MockLunaServiceAdapter from '../mock/MockLunaServiceAdapter';

const Config: Configuration = {
    // prod config
    lunaServiceAdapter: new LunaServiceAdapter(),
    httpProxyServiceAdapter: new HttpProxyServiceAdapter(),
    fileServiceAdapter: new FileServiceAdapter()

    // mock config
    // lunaServiceAdapter: new MockLunaServiceAdapter(),
    // httpProxyServiceAdapter: new MockHttpProxyServiceAdapter(),
    // fileServiceAdapter: new MockFileServiceAdapter()
};

export default Config;
