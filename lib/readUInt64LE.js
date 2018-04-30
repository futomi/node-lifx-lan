module.exports = function(buffer,offset){
	return buffer.readUIntLE(offset,6)<<16+buffer.readUIntLE(offset+6,2);
}
