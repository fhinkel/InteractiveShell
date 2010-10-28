require 'socket'


def handle_connection(server_data, m2_pipes, occupied, timeouts, socket)
	server_data['numthreads'] += 1
	#print "Thread is running\n"
	id = socket.gets.chomp
	msgid = "ID: " + id + " - "
	print msgid + "Connected.\n"
	if timeouts[id]
		print msgid + "Unsetting timeout.\n"
		Thread.kill(timeouts[id])
	end
	if !m2_pipes[id]
		print msgid + "Opening pipe.\n"
		m2_pipes[id] = IO.popen("M2 > results_"+id+".txt 2>&1",'w')
	end
	#print "id: "+id+"\n";
	if (occupied[id] == 1)
		socket.write ">>OCCUPIED<<\n"
		socket.close
		print msgid + "Sending occupied signal.\n"
		return
	end
	socket.write ">>READY<<\n";
	occupied[id] = 1
	while cmd = socket.gets 
		cmd.chomp! # cut off last character, probably \n?
		cmd.strip! # remove all leading and trailing white spaces
		
		#print cmd+"\n"
		#print cmd
		if(cmd == id)
			print msgid + "Closing.\n"
			break
		elsif cmd == ">>RESET<<"
			print msgid + "Reset.\n"
			timeout(m2_pipes, occupied, id)

		else
		  puts "-"+cmd+"-";
		  unless (cmd == "")
		    print "not empty command\n"
			  m2_pipes[id].puts cmd+"\n"
		  else
		    print " empty command\n"
		  end
			#client_data[id+'M2pipe'].flush
		end
	end
	#client_data[id+'M2pipe'].close
	socket.close
	occupied[id] = 0;
	server_data['numthreads'] -= 1
	timeouts[id] = Thread.new {sleep server_data['timeout']; timeout(m2_pipes, occupied, id)}
end

def timeout(m2_pipes, occupied, id)
	print "ID: " + id + " - Timeout.\n"
	m2_pipes[id].puts "exit\n"
	m2_pipes[id].close
	m2_pipes[id] = nil
	occupied[id] = nil
	File.delete("results_" + id + ".txt")
end
	
begin
	tcpserver = TCPServer.new("127.0.0.1", 10000)
	print "TCPServer ready.\n"
	if tcpserver
		server_data = Hash.new  # Hash table for server data, all global variables go here.
		server_data['numthreads'] = 0
		server_data['timeout'] = 15
		m2_pipes = Hash.new
		occupied = Hash.new
		timeouts = Hash.new
		loop do
		socket = tcpserver.accept
			if socket
				print "SERVERMSG: Incoming conncetion.\n"
				Thread.new do
					handle_connection(server_data, m2_pipes, occupied, timeouts, socket)
				end
				
				#print server_data['numthreads'].to_s()+"\n"
			end				
		end
	else
		print "TCPServer not initialized.\n"
	end
rescue Errno::EAGAIN, Errno::ECONNABORTED, Errno::EPROTO, Errno::EINTR
	IO.select([tcpserver])
	print "went here\n"
	retry
end
